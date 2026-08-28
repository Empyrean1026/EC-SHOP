import { config } from "dotenv";
import mongoose, { Types } from "mongoose";

config({ path: ".env.local", quiet: true });

export const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI ?? "mongodb://127.0.0.1:27017/ec_site_e2e";

export function assertSafeE2eDatabaseUri(uri: string): void {
  const databaseName = new URL(uri).pathname.replace(/^\//, "");

  if (databaseName !== "ec_site_e2e") {
    throw new Error("E2E_MONGODB_URI must target the isolated ec_site_e2e database.");
  }
}

export async function resetE2eDatabase(seed: boolean): Promise<void> {
  assertSafeE2eDatabaseUri(E2E_MONGODB_URI);
  const connection = await mongoose.createConnection(E2E_MONGODB_URI).asPromise();

  try {
    await connection.dropDatabase();
    if (!seed) return;

    const now = new Date();
    const categoryId = new Types.ObjectId();
    const productId = new Types.ObjectId("507f1f77bcf86cd799439011");
    await connection.collection("categories").insertOne({
      _id: categoryId,
      name: "测试分类",
      slug: "e2e-products",
      description: "Playwright 隔离测试分类。",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    await connection.collection("products").insertOne({
      _id: productId,
      name: "E2E 测试商品",
      slug: "e2e-test-product",
      description: "用于购物车、结算和订单 API 集成测试的隔离商品。",
      price: 6800,
      currency: "jpy",
      category: categoryId,
      images: [],
      stock: 10,
      rating: 4.8,
      reviewCount: 10,
      salesCount: 20,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  } finally {
    await connection.close();
  }
}
