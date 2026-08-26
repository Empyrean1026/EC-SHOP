import { config } from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel, ProductModel } from "@/models";

config({ path: ".env.local", quiet: true });

const categorySeeds = [
  { name: "家居生活", slug: "home-living", description: "为日常空间选择克制而耐用的物件。" },
  { name: "数码设备", slug: "electronics", description: "兼顾效率、触感与长期使用体验。" },
  { name: "户外出行", slug: "outdoors", description: "轻量、可靠，适合城市与短途户外。" },
  { name: "文具办公", slug: "stationery", description: "让书写与桌面工作更专注。" },
] as const;

const productSeeds = [
  {
    name: "岩石台灯",
    slug: "stone-table-lamp",
    description: "天然石材质感与柔和漫射光结合，为阅读角落提供安静而温暖的照明。",
    price: 21500,
    categorySlug: "home-living",
    stock: 8,
    rating: 4.8,
    reviewCount: 24,
    salesCount: 158,
  },
  {
    name: "亚麻靠垫",
    slug: "linen-cushion",
    description: "高密度亚麻外层搭配弹性填充，适合沙发、座椅和卧室的日常使用。",
    price: 6800,
    categorySlug: "home-living",
    stock: 3,
    rating: 4.6,
    reviewCount: 17,
    salesCount: 96,
  },
  {
    name: "录音室耳机",
    slug: "studio-headphones",
    description: "封闭式声学结构与轻量头梁设计，提供清晰监听和长时间佩戴舒适度。",
    price: 32900,
    categorySlug: "electronics",
    stock: 12,
    rating: 4.9,
    reviewCount: 42,
    salesCount: 211,
  },
  {
    name: "机械键盘",
    slug: "mechanical-keyboard",
    description: "紧凑布局、热插拔轴体和低饱和配色，为桌面工作提供稳定输入体验。",
    price: 18900,
    categorySlug: "electronics",
    stock: 0,
    rating: 4.7,
    reviewCount: 31,
    salesCount: 184,
  },
  {
    name: "轻量随行水瓶",
    slug: "trail-bottle",
    description: "耐用不锈钢瓶身配合防漏旋盖，适合通勤、徒步和日常补水。",
    price: 4200,
    categorySlug: "outdoors",
    stock: 24,
    rating: 4.5,
    reviewCount: 19,
    salesCount: 302,
  },
  {
    name: "折叠日用背包",
    slug: "packable-daypack",
    description: "可折叠轻量面料与多层收纳结构，兼顾旅行备用和城市短途使用。",
    price: 12800,
    categorySlug: "outdoors",
    stock: 6,
    rating: 4.6,
    reviewCount: 27,
    salesCount: 143,
  },
  {
    name: "黄铜中性笔",
    slug: "brass-pen",
    description: "实心黄铜笔身会随使用形成独特光泽，平衡重量带来稳定书写手感。",
    price: 5600,
    categorySlug: "stationery",
    stock: 15,
    rating: 4.8,
    reviewCount: 36,
    salesCount: 267,
  },
  {
    name: "方格笔记本",
    slug: "grid-notebook",
    description: "柔和护眼纸张搭配浅色方格，适合记录、草图和日常项目规划。",
    price: 1800,
    categorySlug: "stationery",
    stock: 42,
    rating: 4.4,
    reviewCount: 14,
    salesCount: 389,
  },
] as const;

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
          images: [],
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
