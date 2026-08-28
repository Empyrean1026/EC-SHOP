import type { NextRequest } from "next/server";
import { adminServiceErrorResponse, authorizeAdminMutation } from "@/lib/api/admin";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { updateAdminOrderStatusSchema } from "@/lib/validations/admin";
import { getValidationErrors } from "@/lib/validations/errors";
import { productIdSchema } from "@/lib/validations/product";
import { getAdminOrder, updateAdminOrderStatus } from "@/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authentication = await authenticateRequest(request, "admin");
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }
  const orderId = productIdSchema.safeParse((await context.params).id);
  if (!orderId.success)
    return apiError("INVALID_ORDER_ID", "注文IDの形式が正しくありません。", 400);
  try {
    const order = await getAdminOrder(orderId.data);
    return order
      ? apiSuccess({ order })
      : apiError("ORDER_NOT_FOUND", "注文が見つかりません。", 404);
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load order");
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authorizationError = await authorizeAdminMutation(request);
  if (authorizationError) return authorizationError;
  const orderId = productIdSchema.safeParse((await context.params).id);
  if (!orderId.success)
    return apiError("INVALID_ORDER_ID", "注文IDの形式が正しくありません。", 400);
  const body = await readJsonBody(request);
  if (!body.success) return apiError(body.code, body.message, body.status);
  const parsed = updateAdminOrderStatusSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "注文状況が正しくありません。",
      422,
      getValidationErrors(parsed.error),
    );
  }
  try {
    return apiSuccess({
      order: await updateAdminOrderStatus(orderId.data, parsed.data.orderStatus),
    });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update order status");
  }
}
