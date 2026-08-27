import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { getUserOrder } from "@/services/order-service";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: OrderRouteContext) {
  try {
    const authentication = await authenticateRequest(request);
    if (!authentication.authenticated) {
      return apiError(authentication.code, authentication.message, authentication.status);
    }

    const order = await getUserOrder(authentication.user.id, (await context.params).id);
    if (!order) return apiError("ORDER_NOT_FOUND", "订单不存在。", 404);
    return apiSuccess(order);
  } catch (error) {
    console.error("[api/orders] Unable to read order", error);
    return apiError("INTERNAL_ERROR", "暂时无法读取订单。", 500);
  }
}
