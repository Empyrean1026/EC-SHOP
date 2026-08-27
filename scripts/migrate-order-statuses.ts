import { config } from "dotenv";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models";

config({ path: ".env.local", quiet: true });

async function migrateOrderStatuses(): Promise<void> {
  await connectToDatabase();

  const [paidResult, completedResult] = await Promise.all([
    OrderModel.collection.updateMany(
      { orderStatus: "confirmed" },
      { $set: { orderStatus: "paid", updatedAt: new Date() } },
    ),
    OrderModel.collection.updateMany(
      { orderStatus: "delivered" },
      { $set: { orderStatus: "completed", updatedAt: new Date() } },
    ),
  ]);

  console.log(
    `Order status migration complete: ${paidResult.modifiedCount} confirmed → paid, ${completedResult.modifiedCount} delivered → completed.`,
  );
}

void migrateOrderStatuses()
  .catch((error: unknown) => {
    console.error("Order status migration failed.", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
