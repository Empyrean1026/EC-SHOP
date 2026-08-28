import type { NextRequest } from "next/server";
import { authorizeAdminMutation } from "@/lib/api/admin";
import { readJsonBody } from "@/lib/api/request";
import { apiError, apiInternalError, apiSuccess } from "@/lib/api/response";
import { isDuplicateKeyError } from "@/lib/mongodb-errors";
import { invalidateCatalogCache } from "@/lib/cache/catalog";
import { getValidationErrors } from "@/lib/validations/errors";
import {
  productIdentifierSchema,
  productIdSchema,
  updateProductSchema,
} from "@/lib/validations/product";
import {
  deactivateProduct,
  getProductByIdentifier,
  ProductCategoryNotFoundError,
  updateProduct,
} from "@/services/product-service";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";
const PRODUCT_BODY_LIMIT_BYTES = 64 * 1024;

export async function GET(_request: NextRequest, { params }: ProductRouteContext) {
  const identifier = productIdentifierSchema.safeParse((await params).id);

  if (!identifier.success) {
    return apiError("INVALID_PRODUCT_IDENTIFIER", "商品标识格式无效。", 400);
  }

  try {
    const product = await getProductByIdentifier(identifier.data);

    return product
      ? apiSuccess({ product })
      : apiError("PRODUCT_NOT_FOUND", "商品不存在或已下架。", 404);
  } catch (error) {
    return apiInternalError(error, "api.products.detail", "暂时无法加载商品。");
  }
}

export async function PUT(request: NextRequest, { params }: ProductRouteContext) {
  const authorizationError = await authorizeAdminMutation(request);

  if (authorizationError) {
    return authorizationError;
  }

  const productId = productIdSchema.safeParse((await params).id);

  if (!productId.success) {
    return apiError("INVALID_PRODUCT_ID", "商品 ID 格式无效。", 400);
  }

  const body = await readJsonBody(request, PRODUCT_BODY_LIMIT_BYTES);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = updateProductSchema.safeParse(body.data);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "请检查提交的商品字段。",
      422,
      getValidationErrors(parsed.error),
    );
  }

  try {
    const product = await updateProduct(productId.data, parsed.data);

    if (product) invalidateCatalogCache();

    return product ? apiSuccess({ product }) : apiError("PRODUCT_NOT_FOUND", "商品不存在。", 404);
  } catch (error) {
    if (error instanceof ProductCategoryNotFoundError) {
      return apiError("CATEGORY_NOT_FOUND", "指定的商品分类不存在或已停用。", 422);
    }

    if (isDuplicateKeyError(error)) {
      return apiError("SLUG_ALREADY_EXISTS", "该商品 Slug 已被使用。", 409);
    }

    return apiInternalError(error, "api.products.update", "暂时无法更新商品。");
  }
}

export async function DELETE(request: NextRequest, { params }: ProductRouteContext) {
  const authorizationError = await authorizeAdminMutation(request);

  if (authorizationError) {
    return authorizationError;
  }

  const productId = productIdSchema.safeParse((await params).id);

  if (!productId.success) {
    return apiError("INVALID_PRODUCT_ID", "商品 ID 格式无效。", 400);
  }

  try {
    const product = await deactivateProduct(productId.data);

    if (product) invalidateCatalogCache();

    return product
      ? apiSuccess({ deleted: true, product })
      : apiError("PRODUCT_NOT_FOUND", "商品不存在或已下架。", 404);
  } catch (error) {
    return apiInternalError(error, "api.products.deactivate", "暂时无法下架商品。");
  }
}
