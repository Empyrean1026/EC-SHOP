import type { NextRequest } from "next/server";
import { cartServiceErrorResponse } from "@/lib/api/cart";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { cartProductIdSchema, updateCartItemSchema } from "@/lib/validations/cart";
import { getValidationErrors } from "@/lib/validations/errors";
import { removeUserCartItem, updateUserCartItem } from "@/services/cart-service";

const CART_BODY_LIMIT_BYTES = 16 * 1024;

type CartItemRouteContext = {
  params: Promise<{ productId: string }>;
};

export async function PATCH(request: NextRequest, context: CartItemRouteContext) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const productId = cartProductIdSchema.safeParse((await context.params).productId);
  if (!productId.success) {
    return apiError("VALIDATION_ERROR", "商品IDの形式が正しくありません。", 422);
  }

  const body = await readJsonBody(request, CART_BODY_LIMIT_BYTES);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = updateCartItemSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "商品の数量をご確認ください。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess({
      cart: await updateUserCartItem(authorization.user.id, productId.data, parsed.data.quantity),
    });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to update cart item");
  }
}

export async function DELETE(request: NextRequest, context: CartItemRouteContext) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const productId = cartProductIdSchema.safeParse((await context.params).productId);
  if (!productId.success) {
    return apiError("VALIDATION_ERROR", "商品IDの形式が正しくありません。", 422);
  }

  try {
    return apiSuccess({
      cart: await removeUserCartItem(authorization.user.id, productId.data),
    });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to remove cart item");
  }
}
