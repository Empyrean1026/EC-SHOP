import type { NextRequest } from "next/server";
import { checkoutServiceErrorResponse } from "@/lib/api/checkout";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { authorizeUserMutation } from "@/lib/api/user";
import { createCheckoutOrderSchema } from "@/lib/validations/checkout";
import { getValidationErrors } from "@/lib/validations/errors";
import { orderListQuerySchema } from "@/lib/validations/order";
import { createCheckoutOrder } from "@/services/checkout-service";
import { listUserOrders } from "@/services/order-service";

const CHECKOUT_BODY_LIMIT_BYTES = 32 * 1024;

export async function GET(request: NextRequest) {
  try {
    const authentication = await authenticateRequest(request);
    if (!authentication.authenticated) {
      return apiError(authentication.code, authentication.message, authentication.status);
    }

    const parsed = orderListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      return apiError(
        "VALIDATION_ERROR",
        "订单查询参数无效。",
        422,
        getValidationErrors(parsed.error),
      );
    }

    return apiSuccess(await listUserOrders(authentication.user.id, parsed.data));
  } catch (error) {
    console.error("[api/orders] Unable to list orders", error);
    return apiError("INTERNAL_ERROR", "暂时无法读取订单。", 500);
  }
}

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
