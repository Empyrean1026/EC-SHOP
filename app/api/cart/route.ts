import type { NextRequest } from "next/server";
import { cartServiceErrorResponse } from "@/lib/api/cart";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { authenticateRequest } from "@/lib/auth/dal";
import { clearUserCart, getUserCart } from "@/services/cart-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authentication = await authenticateRequest(request);

    if (!authentication.authenticated) {
      return apiError(authentication.code, authentication.message, authentication.status);
    }

    return apiSuccess({ cart: await getUserCart(authentication.user.id) });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to load cart");
  }
}

export async function DELETE(request: NextRequest) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  try {
    return apiSuccess({ cart: await clearUserCart(authorization.user.id) });
  } catch (error) {
    return cartServiceErrorResponse(error, "Unable to clear cart");
  }
}
