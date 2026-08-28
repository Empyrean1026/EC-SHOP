import "server-only";

import { logServerEvent } from "@/lib/api/logger";
import { unstable_cache } from "next/cache";

import { Types, type QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { CATALOG_CACHE_TAG } from "@/lib/cache/catalog";
import { CATALOG_CACHE_SECONDS, SEARCH_SUGGESTION_CACHE_SECONDS } from "@/lib/cache/constants";
import { toCatalogProduct } from "@/lib/products/dto";
import { escapeRegularExpression } from "@/lib/products/search";
import { SEARCH_FUZZY_CANDIDATE_LIMIT } from "@/lib/search/constants";
import { containsCjk, fuzzySearchScore, normalizeSearchText } from "@/lib/search/fuzzy";
import type { SearchQuery, SuggestionQuery } from "@/lib/validations/search";
import { CategoryModel, ProductModel, type Product } from "@/models";
import type { CatalogProduct, PaginationMeta } from "@/types/product";
import type {
  ProductSearchResult,
  SearchMode,
  SearchSuggestion,
  SearchSuggestionsResult,
} from "@/types/search";

type SortDirection = 1 | -1;
type StandardSearchSort = Exclude<SearchQuery["sort"], "relevance">;

const STANDARD_SORTS: Record<StandardSearchSort, Record<string, SortDirection>> = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  sales_desc: { salesCount: -1, createdAt: -1, _id: -1 },
};

const FALLBACK_RELEVANCE_SORT: Record<string, SortDirection> = {
  salesCount: -1,
  rating: -1,
  _id: -1,
};

function pagination(query: SearchQuery, total: number): PaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);

  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    hasPreviousPage: query.page > 1 && totalPages > 0,
    hasNextPage: query.page < totalPages,
  };
}

function emptySearchResult(query: SearchQuery, mode: SearchMode = "none"): ProductSearchResult {
  return {
    items: [],
    pagination: pagination(query, 0),
    query: query.q ?? "",
    mode,
  };
}

async function resolveCategoryId(value: string): Promise<Types.ObjectId | null> {
  const identity = Types.ObjectId.isValid(value) ? { _id: value } : { slug: value };
  const category = await CategoryModel.findOne({ ...identity, isActive: true })
    .select("_id")
    .lean();

  return category?._id ?? null;
}

async function createBaseFilter(query: SearchQuery): Promise<QueryFilter<Product> | null> {
  const filter: QueryFilter<Product> = { isActive: true };

  if (query.category) {
    const categoryId = await resolveCategoryId(query.category);
    if (!categoryId) return null;
    filter.category = categoryId;
  }

  if (query.inStock === true) {
    filter.stock = { $gt: 0 };
  } else if (query.inStock === false) {
    filter.stock = 0;
  }

  return filter;
}

function isMissingTextIndex(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const candidate = error as { code?: number; message?: string };
  return candidate.code === 27 || candidate.message?.includes("text index required") === true;
}

function databaseSort(query: SearchQuery): Record<string, SortDirection> {
  return query.sort === "relevance" ? FALLBACK_RELEVANCE_SORT : STANDARD_SORTS[query.sort];
}

async function runTextSearch(
  query: SearchQuery,
  baseFilter: QueryFilter<Product>,
): Promise<ProductSearchResult> {
  const filter: QueryFilter<Product> = {
    ...baseFilter,
    $text: { $search: query.q ?? "" },
  };
  const skip = (query.page - 1) * query.limit;
  const sort =
    query.sort === "relevance"
      ? { score: { $meta: "textScore" as const }, _id: 1 as const }
      : STANDARD_SORTS[query.sort];
  const [documents, total] = await Promise.all([
    ProductModel.find(filter)
      .populate({ path: "category", select: "_id name slug" })
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    items: documents.map(toCatalogProduct),
    pagination: pagination(query, total),
    query: query.q ?? "",
    mode: "full_text",
  };
}

async function runSubstringSearch(
  query: SearchQuery,
  baseFilter: QueryFilter<Product>,
): Promise<ProductSearchResult> {
  const expression = new RegExp(escapeRegularExpression(query.q ?? ""), "i");
  const filter: QueryFilter<Product> = {
    ...baseFilter,
    $or: [{ name: expression }, { description: expression }],
  };
  const skip = (query.page - 1) * query.limit;
  const [documents, total] = await Promise.all([
    ProductModel.find(filter)
      .populate({ path: "category", select: "_id name slug" })
      .sort(databaseSort(query))
      .skip(skip)
      .limit(query.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    items: documents.map(toCatalogProduct),
    pagination: pagination(query, total),
    query: query.q ?? "",
    mode: "substring",
  };
}

type ScoredProduct = {
  product: CatalogProduct;
  score: number;
};

function compareFuzzyProducts(
  left: ScoredProduct,
  right: ScoredProduct,
  sort: SearchQuery["sort"],
): number {
  if (sort === "newest") {
    return (
      Date.parse(right.product.createdAt) - Date.parse(left.product.createdAt) ||
      left.product.id.localeCompare(right.product.id)
    );
  }

  if (sort === "price_asc") {
    return (
      left.product.price - right.product.price || left.product.id.localeCompare(right.product.id)
    );
  }

  if (sort === "price_desc") {
    return (
      right.product.price - left.product.price || left.product.id.localeCompare(right.product.id)
    );
  }

  if (sort === "sales_desc") {
    return (
      right.product.salesCount - left.product.salesCount ||
      left.product.id.localeCompare(right.product.id)
    );
  }

  return (
    right.score - left.score ||
    right.product.salesCount - left.product.salesCount ||
    left.product.id.localeCompare(right.product.id)
  );
}

function scoreProduct(product: CatalogProduct, query: string): number | null {
  const nameScore = fuzzySearchScore(product.name, query);
  const slugScore = fuzzySearchScore(product.slug, query);

  if (nameScore === null && slugScore === null) return null;
  return Math.max(nameScore ?? Number.NEGATIVE_INFINITY, (slugScore ?? 0) - 20);
}

async function runFuzzySearch(
  query: SearchQuery,
  baseFilter: QueryFilter<Product>,
): Promise<ProductSearchResult> {
  const documents = await ProductModel.find(baseFilter)
    .populate({ path: "category", select: "_id name slug" })
    .sort({ salesCount: -1, createdAt: -1, _id: -1 })
    .limit(SEARCH_FUZZY_CANDIDATE_LIMIT)
    .lean();
  const scored = documents
    .map(toCatalogProduct)
    .map((product): ScoredProduct | null => {
      const score = scoreProduct(product, query.q ?? "");
      return score === null ? null : { product, score };
    })
    .filter((entry): entry is ScoredProduct => entry !== null)
    .sort((left, right) => compareFuzzyProducts(left, right, query.sort));
  const skip = (query.page - 1) * query.limit;

  return {
    items: scored.slice(skip, skip + query.limit).map((entry) => entry.product),
    pagination: pagination(query, scored.length),
    query: query.q ?? "",
    mode: scored.length > 0 ? "fuzzy" : "none",
  };
}

async function searchProductsFromDatabase(query: SearchQuery): Promise<ProductSearchResult> {
  if (!query.q) return emptySearchResult(query);

  await connectToDatabase();
  const baseFilter = await createBaseFilter(query);
  if (!baseFilter) return emptySearchResult(query);

  if (!containsCjk(query.q)) {
    try {
      const textResult = await runTextSearch(query, baseFilter);
      if (textResult.pagination.total > 0) return textResult;
    } catch (error) {
      if (!isMissingTextIndex(error)) throw error;
      logServerEvent(
        "warn",
        "search.text-index",
        "Text index unavailable; falling back to substring search.",
      );
    }
  }

  const substringResult = await runSubstringSearch(query, baseFilter);
  if (substringResult.pagination.total > 0 || !query.fuzzy) return substringResult;

  return runFuzzySearch(query, baseFilter);
}

const searchProductsCached = unstable_cache(searchProductsFromDatabase, ["catalog-search-v1"], {
  revalidate: CATALOG_CACHE_SECONDS,
  tags: [CATALOG_CACHE_TAG],
});

export function searchProducts(query: SearchQuery): Promise<ProductSearchResult> {
  return searchProductsCached(query);
}

function suggestionFromProduct(product: CatalogProduct): SearchSuggestion {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    categoryName: product.category?.name ?? null,
    price: product.price,
    currency: product.currency,
    stock: product.stock,
  };
}

function suggestionOrder(left: CatalogProduct, right: CatalogProduct, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  const leftName = normalizeSearchText(left.name);
  const rightName = normalizeSearchText(right.name);
  const leftPrefix = leftName.startsWith(normalizedQuery) ? 1 : 0;
  const rightPrefix = rightName.startsWith(normalizedQuery) ? 1 : 0;

  return (
    rightPrefix - leftPrefix ||
    right.salesCount - left.salesCount ||
    left.name.localeCompare(right.name)
  );
}

async function suggestProductsFromDatabase(
  query: SuggestionQuery,
): Promise<SearchSuggestionsResult> {
  await connectToDatabase();

  const expression = new RegExp(escapeRegularExpression(query.q), "i");
  const directDocuments = await ProductModel.find({ isActive: true, name: expression })
    .populate({ path: "category", select: "_id name slug" })
    .sort({ salesCount: -1, _id: -1 })
    .limit(query.limit * 3)
    .lean();
  const directProducts = directDocuments
    .map(toCatalogProduct)
    .sort((left, right) => suggestionOrder(left, right, query.q))
    .slice(0, query.limit);

  if (directProducts.length >= query.limit) {
    return {
      items: directProducts.map(suggestionFromProduct),
      query: query.q,
      mode: "substring",
    };
  }

  const directIds = new Set(directProducts.map((product) => product.id));
  const candidateDocuments = await ProductModel.find({ isActive: true })
    .populate({ path: "category", select: "_id name slug" })
    .sort({ salesCount: -1, _id: -1 })
    .limit(SEARCH_FUZZY_CANDIDATE_LIMIT)
    .lean();
  const fuzzyProducts = candidateDocuments
    .map(toCatalogProduct)
    .filter((product) => !directIds.has(product.id))
    .map((product) => ({ product, score: scoreProduct(product, query.q) }))
    .filter((entry): entry is ScoredProduct => entry.score !== null)
    .sort(
      (left, right) =>
        right.score - left.score || right.product.salesCount - left.product.salesCount,
    )
    .slice(0, query.limit - directProducts.length)
    .map((entry) => entry.product);
  const products = [...directProducts, ...fuzzyProducts];

  return {
    items: products.map(suggestionFromProduct),
    query: query.q,
    mode: directProducts.length > 0 ? "substring" : fuzzyProducts.length > 0 ? "fuzzy" : "none",
  };
}

const suggestProductsCached = unstable_cache(
  suggestProductsFromDatabase,
  ["catalog-suggestions-v1"],
  {
    revalidate: SEARCH_SUGGESTION_CACHE_SECONDS,
    tags: [CATALOG_CACHE_TAG],
  },
);

export function suggestProducts(query: SuggestionQuery): Promise<SearchSuggestionsResult> {
  return suggestProductsCached(query);
}
