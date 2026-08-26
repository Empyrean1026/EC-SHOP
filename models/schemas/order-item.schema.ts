import { type InferSchemaType, Schema } from "mongoose";
import { isHttpUrl, isNonNegativeSafeInteger, isPositiveSafeInteger } from "@/models/validators";

export const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Order item product is required"],
    },
    name: {
      type: String,
      required: [true, "Order item name is required"],
      trim: true,
      maxlength: [200, "Order item name cannot exceed 200 characters"],
    },
    image: {
      type: String,
      trim: true,
      maxlength: [2048, "Order item image URL cannot exceed 2048 characters"],
      validate: {
        validator: isHttpUrl,
        message: "Order item image must be a valid HTTP URL",
      },
    },
    unitPrice: {
      type: Number,
      required: [true, "Order item unit price is required"],
      min: [0, "Order item unit price cannot be negative"],
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Order item unit price must be a non-negative safe integer",
      },
    },
    quantity: {
      type: Number,
      required: [true, "Order item quantity is required"],
      min: [1, "Order item quantity must be at least 1"],
      max: [99, "Order item quantity cannot exceed 99"],
      validate: {
        validator: isPositiveSafeInteger,
        message: "Order item quantity must be a positive safe integer",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Order item subtotal cannot be negative"],
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Order item subtotal must be a non-negative safe integer",
      },
    },
  },
  {
    _id: false,
  },
);

orderItemSchema.pre("validate", function calculateSubtotal() {
  if (isNonNegativeSafeInteger(this.unitPrice) && isPositiveSafeInteger(this.quantity)) {
    this.subtotal = this.unitPrice * this.quantity;
  }
});

export type OrderItem = InferSchemaType<typeof orderItemSchema>;
