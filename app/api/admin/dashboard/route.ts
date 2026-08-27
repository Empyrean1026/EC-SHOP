import type { NextRequest } from "next/server";
import { adminServiceErrorResponse } from "@/lib/api/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { getAdminDashboardSummary } from "@/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request, "admin");
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }
  try {
    return apiSuccess({ summary: await getAdminDashboardSummary() });
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load dashboard");
  }
}
