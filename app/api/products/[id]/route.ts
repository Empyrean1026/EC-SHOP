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
    return apiError("INVALID_PRODUCT_IDENTIFIER", "商品識別子の形式が正しくありません。", 400);
  }

  try {
    const product = await getProductByIdentifier(identifier.data);

    return product
      ? apiSuccess({ product })
      : apiError("PRODUCT_NOT_FOUND", "商品が見つからないか、販売を終了しています。", 404);
  } catch (error) {
    return apiInternalError(error, "api.products.detail", "商品を読み込めません。");
  }
}

export async function PUT(request: NextRequest, { params }: ProductRouteContext) {
  const authorizationError = await authorizeAdminMutation(request);

  if (authorizationError) {
    return authorizationError;
  }

  const productId = productIdSchema.safeParse((await params).id);

  if (!productId.success) {
    return apiError("INVALID_PRODUCT_ID", "商品IDの形式が正しくありません。", 400);
  }

  const body = await readJsonBody(request, PRODUCT_BODY_LIMIT_BYTES);

  if (!body.success) {
    return apiError(body.code, body.message, body.status);
  }

  const parsed = updateProductSchema.safeParse(body.data);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      "商品の入力内容をご確認ください。",
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
    if (error instanceof ProductCategoryNotFoundError) {
      return apiError(
        "CATEGORY_NOT_FOUND",
        "指定したカテゴリーが見つからないか、利用停止中です。",
        422,
      );
    }

    if (isDuplicateKeyError(error)) {
      return apiError("SLUG_ALREADY_EXISTS", "この商品の Slug はすでに使用されています。", 409);
    }

    return apiInternalError(error, "api.products.update", "商品を更新できません。");
  }
}

export async function DELETE(request: NextRequest, { params }: ProductRouteContext) {
  const authorizationError = await authorizeAdminMutation(request);

  if (authorizationError) {
    return authorizationError;
  }

  const productId = productIdSchema.safeParse((await params).id);

  if (!productId.success) {
    return apiError("INVALID_PRODUCT_ID", "商品IDの形式が正しくありません。", 400);
  }

  try {
    const product = await deactivateProduct(productId.data);

    if (product) invalidateCatalogCache();

    return product
      ? apiSuccess({ deleted: true, product })
      : apiError("PRODUCT_NOT_FOUND", "商品が見つからないか、販売を終了しています。", 404);
  } catch (error) {
    return apiInternalError(error, "api.products.deactivate", "商品を販売停止にできません。");
  }
}
