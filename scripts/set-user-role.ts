import { config } from "dotenv";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models";

config({ path: ".env.local", quiet: true });

const options = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...valueParts] = argument.replace(/^--/, "").split("=");
    return [key, valueParts.join("=")];
  }),
);

const parsed = z
  .object({
    email: z.string().trim().toLowerCase().email(),
    role: z.enum(["customer", "admin"]),
  })
  .safeParse(options);

if (!parsed.success) {
  console.error("Usage: npm run user:role -- --email=user@example.com --role=admin");
  process.exit(1);
}

try {
  await connectToDatabase();

  const user = await UserModel.findOneAndUpdate(
    { email: parsed.data.email },
    { $set: { role: parsed.data.role } },
    { new: true, runValidators: true },
  ).select("email role");

  if (!user) {
    console.error(`User not found: ${parsed.data.email}`);
    process.exitCode = 1;
  } else {
    console.log(`Updated ${user.email} to role ${user.role}. The user must sign in again.`);
  }
} catch (error) {
  console.error("Unable to update the user role.", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
