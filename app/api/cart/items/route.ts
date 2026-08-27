import type { NextRequest } from "next/server";
import { cartServiceErrorResponse } from "@/lib/api/cart";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { addCartItemSchema } from "@/lib/validations/cart";
import { getValidationErrors } from "@/lib/validations/errors";
import { addUserCartItem } from "@/services/cart-service";

const CART_BODY_LIMIT_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const body = await readJsonBody(request, CART_BODY_LIMIT_BYTES);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = addCartItemSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "请检查购物车商品信息。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess({
      cart: await addUserCartItem(
        authorization.user.id,
        parsed.data.productId,
        parsed.data.quantity,
      ),
    });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to add cart item");
  }
}
