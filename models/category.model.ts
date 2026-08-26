import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";
import { configureJsonSerialization } from "@/models/schema-utils";
import { isHttpUrl, SLUG_PATTERN } from "@/models/validators";

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must contain at least 2 characters"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [120, "Category slug cannot exceed 120 characters"],
      match: [SLUG_PATTERN, "Category slug must use lowercase letters, numbers, and hyphens"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Category description cannot exceed 1000 characters"],
    },
    image: {
      type: String,
      trim: true,
      maxlength: [2048, "Category image URL cannot exceed 2048 characters"],
      validate: {
        validator: isHttpUrl,
        message: "Category image must be a valid HTTP URL",
      },
    },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ parentCategory: 1, isActive: 1, name: 1 });
configureJsonSerialization(categorySchema);

export type Category = InferSchemaType<typeof categorySchema>;

export const CategoryModel =
  (models.Category as Model<Category> | undefined) ?? model<Category>("Category", categorySchema);
