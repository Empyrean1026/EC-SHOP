import { setCsrfCookie } from "@/lib/auth/cookies";
import { createCsrfToken } from "@/lib/auth/csrf";
import { apiSuccess, withApiErrorHandling } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export const GET = withApiErrorHandling(async function getCsrfToken() {
  const csrf = await createCsrfToken();
  const response = apiSuccess({ csrfToken: csrf.token });

  setCsrfCookie(response, csrf.cookieValue);
  return response;
}, "api.auth.csrf");
