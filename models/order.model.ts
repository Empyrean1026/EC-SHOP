import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";
import { CURRENCY_CODES, ORDER_STATUSES, PAYMENT_STATUSES } from "@/models/constants";
import { configureJsonSerialization } from "@/models/schema-utils";
import { addressSchema } from "@/models/schemas/address.schema";
import { orderItemSchema } from "@/models/schemas/order-item.schema";
import { isNonNegativeSafeInteger } from "@/models/validators";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order user is required"],
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order items are required"],
      validate: [
        {
          validator: (items: unknown[]) => items.length > 0,
          message: "Order must contain at least one item",
        },
        {
          validator: (items: unknown[]) => items.length <= 100,
          message: "Order cannot contain more than 100 items",
        },
      ],
    },
    totalAmount: {
      type: Number,
      required: [true, "Order total amount is required"],
      min: [0, "Order total amount cannot be negative"],
      validate: {
        validator: isNonNegativeSafeInteger,
        message: "Order total amount must be a non-negative safe integer",
      },
    },
    currency: {
      type: String,
      enum: {
        values: CURRENCY_CODES,
        message: "Order currency is not supported",
      },
      lowercase: true,
      default: "jpy",
    },
    paymentStatus: {
      type: String,
      enum: {
        values: PAYMENT_STATUSES,
        message: "Payment status is invalid",
      },
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: {
        values: ORDER_STATUSES,
        message: "Order status is invalid",
      },
      default: "pending",
    },
    shippingAddress: {
      type: addressSchema,
      required: [true, "Shipping address is required"],
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      maxlength: [255, "Stripe PaymentIntent ID cannot exceed 255 characters"],
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
configureJsonSerialization(orderSchema);

export type Order = InferSchemaType<typeof orderSchema>;

export const OrderModel =
  (models.Order as Model<Order> | undefined) ?? model<Order>("Order", orderSchema);
