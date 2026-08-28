import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { categorySeeds, productSeeds } from "@/scripts/catalog-seed-data";

const illustratedProducts = productSeeds.filter(
  (product): product is (typeof productSeeds)[number] & { images: readonly [string] } =>
    "images" in product,
);

test("catalog seed contains ten complete gradient-image demo products", () => {
  assert.equal(illustratedProducts.length, 10);
  assert.equal(new Set(productSeeds.map((product) => product.slug)).size, productSeeds.length);

  const categorySlugs = new Set(categorySeeds.map((category) => category.slug));
  for (const product of illustratedProducts) {
    assert.ok(product.name.length >= 2);
    assert.match(product.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(product.description.length >= 10);
    assert.ok(categorySlugs.has(product.categorySlug));
    assert.ok(Number.isSafeInteger(product.price) && product.price > 0);
    assert.ok(Number.isSafeInteger(product.stock) && product.stock > 0);
    assert.equal(product.images.length, 1);
  }
});

test("seed product SVGs are local text-free gradients without active or external content", () => {
  for (const product of illustratedProducts) {
    const image = product.images[0];
    assert.match(image, /^\/products\/[a-z0-9-]+\.svg$/);

    const file = path.join(process.cwd(), "public", image.slice(1));
    assert.equal(existsSync(file), true, `${image} should exist`);
    const svg = readFileSync(file, "utf8");
    assert.match(svg, /^<svg\s/);
    assert.doesNotMatch(svg, /<(?:script|foreignObject|image|use)\b/i);
    assert.doesNotMatch(svg, /(?:href|on\w+)\s*=/i);
    assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"', ""), /https?:\/\//i);
    assert.doesNotMatch(svg, /<(?:text|title|desc)\b/i);
    assert.match(svg, /<linearGradient\b/);
  }
});
