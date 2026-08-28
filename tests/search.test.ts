import assert from "node:assert/strict";
import test from "node:test";
import { ProductModel } from "@/models";
import {
  containsCjk,
  fuzzySearchScore,
  levenshteinDistance,
  normalizeSearchText,
} from "@/lib/search/fuzzy";
import { buildSearchUrl } from "@/lib/search/url";
import { searchQuerySchema, suggestionQuerySchema } from "@/lib/validations/search";

test("search query validation trims values and coerces safe controls", () => {
  const parsed = searchQuerySchema.safeParse({
    q: "  headphones  ",
    page: "2",
    limit: "20",
    inStock: "true",
    fuzzy: "false",
    sort: "sales_desc",
  });

  assert.equal(parsed.success, true);

  if (parsed.success) {
    assert.equal(parsed.data.q, "headphones");
    assert.equal(parsed.data.page, 2);
    assert.equal(parsed.data.inStock, true);
    assert.equal(parsed.data.fuzzy, false);
  }
});

test("search validation rejects short queries, excessive limits, and unknown fields", () => {
  assert.equal(searchQuerySchema.safeParse({ q: "x" }).success, false);
  assert.equal(searchQuerySchema.safeParse({ q: "lamp", limit: "1000" }).success, false);
  assert.equal(searchQuerySchema.safeParse({ q: "lamp", $where: "unsafe" }).success, false);
  assert.equal(suggestionQuerySchema.safeParse({ q: "x" }).success, false);
  assert.equal(suggestionQuerySchema.safeParse({ q: "lamp", limit: "11" }).success, false);
});

test("search URLs preserve filters while resetting or advancing pagination", () => {
  const query = searchQuerySchema.parse({
    q: "studio headphones",
    category: "electronics",
    page: "2",
    inStock: "true",
    fuzzy: "false",
    sort: "price_asc",
  });
  const nextPage = buildSearchUrl(query, { page: 3 });
  const cleared = buildSearchUrl(query, { category: null, inStock: null, page: 1 });

  assert.match(nextPage, /^\/search\?/);
  assert.match(nextPage, /q=studio\+headphones/);
  assert.match(nextPage, /category=electronics/);
  assert.match(nextPage, /page=3/);
  assert.match(nextPage, /fuzzy=false/);
  assert.doesNotMatch(cleared, /category=/);
  assert.doesNotMatch(cleared, /inStock=/);
});

test("search text normalization handles case, accents, punctuation, and CJK", () => {
  assert.equal(normalizeSearchText("  Café-LAMP! "), "cafelamp");
  assert.equal(containsCjk("スタジオヘッドホン"), true);
  assert.equal(containsCjk("studio headphones"), false);
});

test("Levenshtein distance and fuzzy score tolerate bounded product-name typos", () => {
  assert.equal(levenshteinDistance("headphones", "headphnes"), 1);
  assert.notEqual(fuzzySearchScore("Studio Headphones", "headphnes"), null);
  assert.notEqual(fuzzySearchScore("スタジオヘッドホン", "スタジオヘットホン"), null);
  assert.equal(fuzzySearchScore("Stone Table Lamp", "keyboard"), null);
});

test("Product declares the weighted full-text index required by search", () => {
  const searchIndex = ProductModel.schema
    .indexes()
    .find(([, options]) => options.name === "product_search");

  assert.deepEqual(searchIndex?.[0], { name: "text", description: "text" });
  assert.deepEqual(searchIndex?.[1].weights, { name: 10, description: 2 });
});
