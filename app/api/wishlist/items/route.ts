import type { NextRequest } from "next/server";
import { accountServiceErrorResponse } from "@/lib/api/account";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { wishlistProductSchema } from "@/lib/validations/account";
import { getValidationErrors } from "@/lib/validations/errors";
import { addWishlistProduct } from "@/services/wishlist-service";

export async function POST(request: NextRequest) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const body = await readJsonBody(request);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = wishlistProductSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "商品情報が正しくありません。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    await addWishlistProduct(authorization.user.id, parsed.data.productId);
    return apiSuccess({ productId: parsed.data.productId, wishlisted: true });
  } catch (error) {
    return accountServiceErrorResponse(error, "Unable to add wishlist product");
  }
}
