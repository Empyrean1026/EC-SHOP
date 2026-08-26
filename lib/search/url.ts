import type { SearchQuery } from "@/lib/validations/search";

type SearchQueryOverride = Partial<{
  [Key in keyof SearchQuery]: SearchQuery[Key] | null;
}>;

export function buildSearchUrl(query: SearchQuery, override: SearchQueryOverride = {}): string {
  const value = { ...query, ...override };
  const parameters = new URLSearchParams();

  if (value.q) parameters.set("q", value.q);
  if (value.category) parameters.set("category", value.category);
  if ((value.page ?? 1) > 1) parameters.set("page", String(value.page));
  if ((value.limit ?? 12) !== 12) parameters.set("limit", String(value.limit));
  if (value.inStock === true) parameters.set("inStock", "true");
  if (value.fuzzy === false) parameters.set("fuzzy", "false");
  if (value.sort && value.sort !== "relevance") parameters.set("sort", value.sort);

  const queryString = parameters.toString();
  return queryString ? `/search?${queryString}` : "/search";
}
