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

const roleOptions = parsed.data;

async function setUserRole(): Promise<void> {
  await connectToDatabase();

  const user = await UserModel.findOneAndUpdate(
    { email: roleOptions.email },
    { $set: { role: roleOptions.role } },
    { returnDocument: "after", runValidators: true },
  ).select("email role");

  if (!user) {
    console.error(`User not found: ${roleOptions.email}`);
    process.exitCode = 1;
  } else {
    console.log(`Updated ${user.email} to role ${user.role}. The user must sign in again.`);
  }
}

void setUserRole()
  .catch((error: unknown) => {
    console.error("Unable to update the user role.", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
