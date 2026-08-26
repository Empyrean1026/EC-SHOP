import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";
import { configureJsonSerialization } from "@/models/schema-utils";
import { cartItemSchema, type CartItem } from "@/models/schemas/cart-item.schema";

function hasUniqueProducts(items: CartItem[]): boolean {
  const productIds = items.map((item) => String(item.productId));
  return new Set(productIds).size === productIds.length;
}

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cart user is required"],
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: [
        {
          validator: (items: CartItem[]) => items.length <= 100,
          message: "Cart cannot contain more than 100 distinct products",
        },
        {
          validator: hasUniqueProducts,
          message: "Each product can only appear once in a cart",
        },
      ],
    },
  },
  {
    timestamps: true,
  },
);

configureJsonSerialization(cartSchema);

export type Cart = InferSchemaType<typeof cartSchema>;

export const CartModel =
  (models.Cart as Model<Cart> | undefined) ?? model<Cart>("Cart", cartSchema);
