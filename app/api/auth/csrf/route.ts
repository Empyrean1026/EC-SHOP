import { setCsrfCookie } from "@/lib/auth/cookies";
import { createCsrfToken } from "@/lib/auth/csrf";
import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const csrf = await createCsrfToken();
  const response = apiSuccess({ csrfToken: csrf.token });

  setCsrfCookie(response, csrf.cookieValue);
  return response;
}
