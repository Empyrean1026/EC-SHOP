export const PRODUCT_SORT_VALUES = [
  "newest",
  "price_asc",
  "price_desc",
  "sales_desc",
  "rating_desc",
] as const;

export type ProductSort = (typeof PRODUCT_SORT_VALUES)[number];

export const PRODUCT_PAGE_SIZE = 12;
export const PRODUCT_MAX_PAGE_SIZE = 50;
