import { apiError, apiSuccess } from "@/lib/api/response";
import { listCategories } from "@/services/product-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess({ categories: await listCategories() });
  } catch (error) {
    console.error("[api/categories] Unable to list categories", error);
    return apiError("INTERNAL_ERROR", "暂时无法加载商品分类。", 500);
  }
}
