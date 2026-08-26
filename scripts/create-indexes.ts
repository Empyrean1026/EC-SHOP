import { config } from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { CartModel, CategoryModel, OrderModel, ProductModel, UserModel } from "@/models";

config({ path: ".env.local", quiet: true });

const databaseModels = [UserModel, CategoryModel, ProductModel, OrderModel, CartModel];

try {
  await connectToDatabase();

  for (const databaseModel of databaseModels) {
    await databaseModel.createIndexes();
    console.log(`${databaseModel.modelName}: indexes ready`);
  }

  console.log("Database indexes created successfully.");
} catch (error) {
  console.error("Database index creation failed.", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
