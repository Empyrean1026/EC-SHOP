import type { NextRequest } from "next/server";
import { accountServiceErrorResponse } from "@/lib/api/account";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { wishlistProductSchema } from "@/lib/validations/account";
import { removeWishlistProduct } from "@/services/wishlist-service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> },
) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const parsed = wishlistProductSchema.safeParse({ productId: (await context.params).productId });
  if (!parsed.success)
    return apiError("INVALID_PRODUCT_ID", "商品IDの形式が正しくありません。", 400);

  try {
    await removeWishlistProduct(authorization.user.id, parsed.data.productId);
    return apiSuccess({ productId: parsed.data.productId, wishlisted: false });
  } catch (error) {
    return accountServiceErrorResponse(error, "Unable to remove wishlist product");
  }
}
