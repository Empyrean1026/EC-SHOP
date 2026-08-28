import type { NextRequest } from "next/server";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
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
    if (!order) return apiError("ORDER_NOT_FOUND", "注文が見つかりません。", 404);
    return apiSuccess(order);
  } catch (error) {
    return apiInternalError(error, "api.orders.detail", "注文を取得できません。");
  }
}
