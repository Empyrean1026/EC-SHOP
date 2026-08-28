import type { NextRequest } from "next/server";
import { authorizeAdminMutation } from "@/lib/api/admin";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { isDuplicateKeyError } from "@/lib/mongodb-errors";
import { invalidateCatalogCache } from "@/lib/cache/catalog";
import { getValidationErrors } from "@/lib/validations/errors";
import { createProductSchema, productListQuerySchema } from "@/lib/validations/product";
import {
  createProduct,
  listProducts,
  ProductCategoryNotFoundError,
} from "@/services/product-service";

export const dynamic = "force-dynamic";
const PRODUCT_BODY_LIMIT_BYTES = 64 * 1024;

export async function GET(request: NextRequest) {
  const parsed = productListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "查询参数无效。", 422, getValidationErrors(parsed.error));
  }

  try {
    const result = await listProducts(parsed.data);
    return apiSuccess({ ...result, filters: parsed.data });
  } catch (error) {
    return apiInternalError(error, "api.products.list", "暂时无法加载商品。");
  }
}

export async function POST(request: NextRequest) {
  const authorizationError = await authorizeAdminMutation(request);

  if (authorizationError) {
    return authorizationError;
  }

  const body = await readJsonBody(request, PRODUCT_BODY_LIMIT_BYTES);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = createProductSchema.safeParse(body.data);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "请检查提交的商品字段。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    const product = await createProduct(parsed.data);
    invalidateCatalogCache();
    return apiSuccess({ product }, 201);
  } catch (error) {
    if (error instanceof ProductCategoryNotFoundError) {
      return apiError("CATEGORY_NOT_FOUND", "指定的商品分类不存在或已停用。", 422);
    }

    if (isDuplicateKeyError(error)) {
      return apiError("SLUG_ALREADY_EXISTS", "该商品 Slug 已被使用。", 409);
    }

    return apiInternalError(error, "api.products.create", "暂时无法创建商品。");
  }
}
