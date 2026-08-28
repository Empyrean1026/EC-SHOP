import type { NextRequest } from "next/server";
import { adminServiceErrorResponse, authorizeAdminMutation } from "@/lib/api/admin";
import { invalidateCatalogCache } from "@/lib/cache/catalog";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiSuccess } from "@/lib/api/response";
import { updateAdminStockSchema } from "@/lib/validations/admin";
import { getValidationErrors } from "@/lib/validations/errors";
import { productIdSchema } from "@/lib/validations/product";
import { updateProduct } from "@/services/product-service";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authorizationError = await authorizeAdminMutation(request);
  if (authorizationError) return authorizationError;
  const productId = productIdSchema.safeParse((await context.params).id);
  if (!productId.success)
    return apiError("INVALID_PRODUCT_ID", "商品IDの形式が正しくありません。", 400);
  const body = await readJsonBody(request);
  if (!body.success) return apiError(body.code, body.message, body.status);
  const parsed = updateAdminStockSchema.safeParse(body.data);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "在庫数が正しくありません。",
      422,
      getValidationErrors(parsed.error),
    );
  }
  try {
    const product = await updateProduct(productId.data, parsed.data);
    if (product) invalidateCatalogCache();
    return product
      ? apiSuccess({ product })
      : apiError("PRODUCT_NOT_FOUND", "商品が見つかりません。", 404);
  } catch (error) {
    return adminServiceErrorResponse(error, "Unable to update stock");
  }
}
