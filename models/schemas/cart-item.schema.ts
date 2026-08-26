import { type InferSchemaType, Schema } from "mongoose";
import { isPositiveSafeInteger } from "@/models/validators";

export const cartItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Cart item product is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Cart item quantity is required"],
      min: [1, "Cart item quantity must be at least 1"],
      max: [99, "Cart item quantity cannot exceed 99"],
      validate: {
        validator: isPositiveSafeInteger,
        message: "Cart item quantity must be a positive safe integer",
      },
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

export type CartItem = InferSchemaType<typeof cartItemSchema>;
