import type { NextRequest } from "next/server";
import { paymentServiceErrorResponse } from "@/lib/api/payment";
import { apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { createOrRetrievePaymentIntent } from "@/services/payment-service";

type PaymentIntentRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: PaymentIntentRouteContext) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  try {
    const result = await createOrRetrievePaymentIntent(
      authorization.user.id,
      (await context.params).id,
    );
    return apiSuccess(result);
  } catch (error) {
    return paymentServiceErrorResponse(error, "Unable to create PaymentIntent");
  }
}
