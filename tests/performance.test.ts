import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProductVisual } from "@/components/products/product-visual";
import {
  CATALOG_CACHE_SECONDS,
  CATEGORY_CACHE_SECONDS,
  SEARCH_SUGGESTION_CACHE_SECONDS,
} from "@/lib/cache/constants";

test("catalog cache windows keep suggestions freshest and categories longest", () => {
  assert.equal(SEARCH_SUGGESTION_CACHE_SECONDS < CATALOG_CACHE_SECONDS, true);
  assert.equal(CATALOG_CACHE_SECONDS < CATEGORY_CACHE_SECONDS, true);
});

test("product images lazy load by default and preload only the LCP image", () => {
  const image = "https://example.com/product.jpg";
  const lazyMarkup = renderToStaticMarkup(ProductVisual({ name: "Product", image }));
  const priorityMarkup = renderToStaticMarkup(
    ProductVisual({ name: "Product", image, priority: true }),
  );

  assert.match(lazyMarkup, /loading="lazy"/);
  assert.match(lazyMarkup, /data-nimg="fill"/);
  assert.doesNotMatch(lazyMarkup, /rel="preload"/);
  assert.match(priorityMarkup, /rel="preload"/);
  assert.doesNotMatch(priorityMarkup, /loading="lazy"/);
});
