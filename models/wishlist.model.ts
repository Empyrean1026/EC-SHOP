import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";
import { configureJsonSerialization } from "@/models/schema-utils";

function hasUniqueProducts(productIds: unknown[]): boolean {
  return new Set(productIds.map(String)).size === productIds.length;
}

const wishlistSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Wishlist user is required"],
      unique: true,
    },
    productIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
      validate: [
        {
          validator: (productIds: unknown[]) => productIds.length <= 100,
          message: "Wishlist cannot contain more than 100 products",
        },
        {
          validator: hasUniqueProducts,
          message: "Each product can only appear once in a wishlist",
        },
      ],
    },
  },
  { timestamps: true },
);

configureJsonSerialization(wishlistSchema);

export type Wishlist = InferSchemaType<typeof wishlistSchema>;

export const WishlistModel =
  (models.Wishlist as Model<Wishlist> | undefined) ?? model<Wishlist>("Wishlist", wishlistSchema);
