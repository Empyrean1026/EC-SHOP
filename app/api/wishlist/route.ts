import type { NextRequest } from "next/server";
import { accountServiceErrorResponse } from "@/lib/api/account";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { getUserWishlist } from "@/services/wishlist-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request);
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }

  try {
    return apiSuccess({ wishlist: await getUserWishlist(authentication.user.id) });
  } catch (error) {
    return accountServiceErrorResponse(error, "Unable to load wishlist");
  }
}
