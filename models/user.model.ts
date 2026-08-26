import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";
import { USER_ROLES } from "@/models/constants";
import { configureJsonSerialization } from "@/models/schema-utils";
import { addressSchema } from "@/models/schemas/address.schema";
import { EMAIL_PATTERN, isHttpUrl } from "@/models/validators";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      minlength: [2, "User name must contain at least 2 characters"],
      maxlength: [100, "User name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"],
      match: [EMAIL_PATTERN, "Email must be valid"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
      minlength: [60, "Password hash is invalid"],
      maxlength: [255, "Password hash is invalid"],
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be customer or admin",
      },
      default: "customer",
    },
    avatar: {
      type: String,
      trim: true,
      maxlength: [2048, "Avatar URL cannot exceed 2048 characters"],
      validate: {
        validator: isHttpUrl,
        message: "Avatar must be a valid HTTP URL",
      },
    },
    address: {
      type: addressSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ role: 1, createdAt: -1 });
configureJsonSerialization(userSchema, ["passwordHash"]);

export type User = InferSchemaType<typeof userSchema>;

export const UserModel =
  (models.User as Model<User> | undefined) ?? model<User>("User", userSchema);
