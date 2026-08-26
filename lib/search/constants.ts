export const SEARCH_SORT_VALUES = [
  "relevance",
  "newest",
  "price_asc",
  "price_desc",
  "sales_desc",
] as const;

export type SearchSort = (typeof SEARCH_SORT_VALUES)[number];

export const SEARCH_PAGE_SIZE = 12;
export const SEARCH_MAX_PAGE_SIZE = 40;
export const SEARCH_SUGGESTION_LIMIT = 8;
export const SEARCH_MAX_SUGGESTION_LIMIT = 10;
export const SEARCH_FUZZY_CANDIDATE_LIMIT = 200;
export const SEARCH_DEBOUNCE_MS = 250;
export const SEARCH_HISTORY_LIMIT = 8;
export const SEARCH_HISTORY_STORAGE_KEY = "ec-search-history-v1";
