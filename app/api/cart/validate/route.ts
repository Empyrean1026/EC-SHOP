import type { NextRequest } from "next/server";
import { cartServiceErrorResponse } from "@/lib/api/cart";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { cartLinesSchema } from "@/lib/validations/cart";
import { getValidationErrors } from "@/lib/validations/errors";
import { validateCartLines } from "@/services/cart-service";

const CART_VALIDATION_BODY_LIMIT_BYTES = 32 * 1024;

export async function POST(request: NextRequest) {
  const body = await readJsonBody(request, CART_VALIDATION_BODY_LIMIT_BYTES);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = cartLinesSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "端末内のカート内容をご確認ください。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    return apiSuccess({ cart: await validateCartLines(parsed.data.items) });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to validate guest cart");
  }
}
