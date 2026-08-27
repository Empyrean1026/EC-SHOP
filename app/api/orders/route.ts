import type { NextRequest } from "next/server";
import { checkoutServiceErrorResponse } from "@/lib/api/checkout";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { createCheckoutOrderSchema } from "@/lib/validations/checkout";
import { getValidationErrors } from "@/lib/validations/errors";
import { createCheckoutOrder } from "@/services/checkout-service";

const CHECKOUT_BODY_LIMIT_BYTES = 32 * 1024;

export async function POST(request: NextRequest) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const body = await readJsonBody(request, CHECKOUT_BODY_LIMIT_BYTES);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = createCheckoutOrderSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "请检查收货地址和支付方式。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    const result = await createCheckoutOrder(authorization.user.id, parsed.data);
    return apiSuccess(result, result.created ? 201 : 200);
  } catch (error) {
    return checkoutServiceErrorResponse(error, "Unable to create order");
  }
}
