import { apiInternalError, apiSuccess } from "@/lib/api/response";
import { listCategories } from "@/services/product-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess({ categories: await listCategories() });
  } catch (error) {
    return apiInternalError(error, "api.categories.list", "カテゴリーを読み込めません。");
  }
}
