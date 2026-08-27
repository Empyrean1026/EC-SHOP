import type { NextRequest } from "next/server";
import { accountServiceErrorResponse } from "@/lib/api/account";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authorizeUserMutation } from "@/lib/api/user";
import { authenticateRequest } from "@/lib/auth/dal";
import { updateProfileSchema } from "@/lib/validations/account";
import { getValidationErrors } from "@/lib/validations/errors";
import { getAccountProfile, updateAccountProfile } from "@/services/account-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authentication = await authenticateRequest(request);
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }

  try {
    const profile = await getAccountProfile(authentication.user.id);
    return profile ? apiSuccess({ profile }) : apiError("USER_NOT_FOUND", "账户不存在。", 404);
  } catch (error) {
    return accountServiceErrorResponse(error, "Unable to load profile");
  }
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeUserMutation(request);
  if (!authorization.authorized) return authorization.response;

  const body = await readJsonBody(request);
  if (!body.success) return apiError(body.code, body.message, body.status);

  const parsed = updateProfileSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "请检查个人资料。", 422, getValidationErrors(parsed.error));
  }

  try {
    const profile = await updateAccountProfile(authorization.user.id, parsed.data);
    return profile ? apiSuccess({ profile }) : apiError("USER_NOT_FOUND", "账户不存在。", 404);
  } catch (error) {
    return accountServiceErrorResponse(error, "Unable to update profile");
  }
}
