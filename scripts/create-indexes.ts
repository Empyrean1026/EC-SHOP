import { config } from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { CartModel, CategoryModel, OrderModel, ProductModel, UserModel } from "@/models";

config({ path: ".env.local", quiet: true });

const databaseModels = [UserModel, CategoryModel, ProductModel, OrderModel, CartModel];

async function createIndexes(): Promise<void> {
  await connectToDatabase();

  for (const databaseModel of databaseModels) {
    await databaseModel.createIndexes();
    console.log(`${databaseModel.modelName}: indexes ready`);
  }

  console.log("Database indexes created successfully.");
}

void createIndexes()
  .catch((error: unknown) => {
    console.error("Database index creation failed.", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
