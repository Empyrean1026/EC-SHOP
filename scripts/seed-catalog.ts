import { config } from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/models";
import { categorySeeds, productSeeds } from "@/scripts/catalog-seed-data";

config({ path: ".env.local", quiet: true });

async function seedCatalog(): Promise<void> {
  await connectToDatabase();

  for (const category of categorySeeds) {
    await CategoryModel.findOneAndUpdate(
      { slug: category.slug },
      { $set: { ...category, isActive: true } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  const categories = await CategoryModel.find({
    slug: { $in: categorySeeds.map((category) => category.slug) },
  }).select("_id slug");
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category._id]));

  for (const { categorySlug, ...product } of productSeeds) {
    const category = categoryBySlug.get(categorySlug);

    if (!category) {
      throw new Error(`Seed category missing: ${categorySlug}`);
    }

    await ProductModel.findOneAndUpdate(
      { slug: product.slug },
      {
        $set: {
          ...product,
          category,
          currency: "jpy",
          images: "images" in product ? product.images : [],
          isActive: true,
        },
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  }

  console.log(
    `Catalog seed complete: ${categorySeeds.length} categories, ${productSeeds.length} products.`,
  );
}

void seedCatalog()
  .catch((error: unknown) => {
    console.error("Catalog seed failed.", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
