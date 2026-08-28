import type { NextRequest } from "next/server";
import { adminServiceErrorResponse } from "@/lib/api/admin";
import { apiError, apiSuccess } from "@/lib/api/response";
import { authenticateRequest } from "@/lib/auth/dal";
import { productIdSchema } from "@/lib/validations/product";
import { getAdminProduct } from "@/services/admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authentication = await authenticateRequest(request, "admin");
  if (!authentication.authenticated) {
    return apiError(authentication.code, authentication.message, authentication.status);
  }
  const productId = productIdSchema.safeParse((await context.params).id);
  if (!productId.success)
    return apiError("INVALID_PRODUCT_ID", "商品IDの形式が正しくありません。", 400);

  try {
    const product = await getAdminProduct(productId.data);
    return product
      ? apiSuccess({ product })
      : apiError("PRODUCT_NOT_FOUND", "商品が見つかりません。", 404);
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to load product");
  }
}
