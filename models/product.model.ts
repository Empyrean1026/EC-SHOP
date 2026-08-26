import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";
import { CURRENCY_CODES } from "@/models/constants";
import { configureJsonSerialization } from "@/models/schema-utils";
import { isHttpUrl, isNonNegativeSafeInteger, SLUG_PATTERN } from "@/models/validators";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must contain at least 2 characters"],
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [220, "Product slug cannot exceed 220 characters"],
      match: [SLUG_PATTERN, "Product slug must use lowercase letters, numbers, and hyphens"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Product description must contain at least 10 characters"],
      maxlength: [10000, "Product description cannot exceed 10000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Product price cannot be negative"],
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Product price must be a non-negative safe integer",
      },
    },
    currency: {
      type: String,
      enum: {
        values: CURRENCY_CODES,
        message: "Product currency is not supported",
      },
      lowercase: true,
      default: "jpy",
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product category is required"],
    },
    images: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [2048, "Product image URL cannot exceed 2048 characters"],
          validate: {
            validator: isHttpUrl,
            message: "Product image must be a valid HTTP URL",
          },
        },
      ],
      default: [],
      validate: {
        validator: (images: string[]) => images.length <= 12,
        message: "Product cannot contain more than 12 images",
      },
    },
    stock: {
      type: Number,
      min: [0, "Product stock cannot be negative"],
      default: 0,
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Product stock must be a non-negative safe integer",
      },
    },
    rating: {
      type: Number,
      min: [0, "Product rating cannot be below 0"],
      max: [5, "Product rating cannot exceed 5"],
      default: 0,
    },
    reviewCount: {
      type: Number,
      min: [0, "Product review count cannot be negative"],
      default: 0,
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Product review count must be a non-negative safe integer",
      },
    },
    salesCount: {
      type: Number,
      min: [0, "Product sales count cannot be negative"],
      default: 0,
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Product sales count must be a non-negative safe integer",
      },
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

productSchema.index(
  { name: "text", description: "text" },
  { weights: { name: 10, description: 2 }, name: "product_search" },
);
productSchema.index({ category: 1, isActive: 1, createdAt: -1 });
productSchema.index({ category: 1, isActive: 1, price: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ isActive: 1, salesCount: -1, createdAt: -1 });
productSchema.index({ isActive: 1, rating: -1, createdAt: -1 });
configureJsonSerialization(productSchema);

export type Product = InferSchemaType<typeof productSchema>;

export const ProductModel =
  (models.Product as Model<Product> | undefined) ?? model<Product>("Product", productSchema);
