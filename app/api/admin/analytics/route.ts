import type { NextRequest } from "next/server";
import { adminServiceErrorResponse } from "@/lib/api/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { getSalesAnalytics } from "@/services/analytics-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request, "admin");
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }

  try {
    return apiSuccess({ analytics: await getSalesAnalytics() });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load sales analytics");
  }
}
