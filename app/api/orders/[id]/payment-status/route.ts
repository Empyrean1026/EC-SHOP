import type { NextRequest } from "next/server";
import { paymentServiceErrorResponse } from "@/lib/api/payment";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { getOrderPaymentStatus } from "@/services/payment-service";

type PaymentStatusRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: PaymentStatusRouteContext) {
  try {
    const authentication = await authenticateRequest(request);
    if (!authentication.authenticated) {
      return apiError(authentication.code, authentication.message, authentication.status);
    }

    const result = await getOrderPaymentStatus(authentication.user.id, (await context.params).id);
    return apiSuccess(result);
  } catch (error) {
    return paymentServiceErrorResponse(error, "Unable to read payment status");
  }
}
