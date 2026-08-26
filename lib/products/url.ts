import type { ProductListQuery } from "@/lib/validations/product";

type QueryOverride = Partial<{
  [Key in keyof ProductListQuery]: ProductListQuery[Key] | null;
}>;

export function buildProductsUrl(query: ProductListQuery, override: QueryOverride = {}): string {
  const value = { ...query, ...override };
  const page = value.page ?? query.page;
  const limit = value.limit ?? query.limit;
  const sort = value.sort ?? query.sort;
  const parameters = new URLSearchParams();

  if (value.q) parameters.set("q", value.q);
  if (value.category) parameters.set("category", value.category);
  if (page > 1) parameters.set("page", String(page));
  if (limit !== 12) parameters.set("limit", String(limit));
  if (value.minPrice !== undefined && value.minPrice !== null) {
    parameters.set("minPrice", String(value.minPrice));
  }
  if (value.maxPrice !== undefined && value.maxPrice !== null) {
    parameters.set("maxPrice", String(value.maxPrice));
  }
  if (value.currency) parameters.set("currency", value.currency);
  if (value.inStock !== undefined && value.inStock !== null) {
    parameters.set("inStock", String(value.inStock));
  }
  if (sort !== "newest") parameters.set("sort", sort);

  const queryString = parameters.toString();
  return queryString ? `/products?${queryString}` : "/products";
}
