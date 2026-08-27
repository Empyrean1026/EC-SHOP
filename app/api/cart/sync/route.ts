import type { NextRequest } from "next/server";
import { cartServiceErrorResponse } from "@/lib/api/cart";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { cartLinesSchema } from "@/lib/validations/cart";
import { getValidationErrors } from "@/lib/validations/errors";
import { mergeUserCart } from "@/services/cart-service";

const CART_SYNC_BODY_LIMIT_BYTES = 32 * 1024;

export async function POST(request: NextRequest) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const body = await readJsonBody(request, CART_SYNC_BODY_LIMIT_BYTES);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = cartLinesSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "请检查待同步的购物车。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess({ cart: await mergeUserCart(authorization.user.id, parsed.data.items) });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to synchronize cart");
  }
}
