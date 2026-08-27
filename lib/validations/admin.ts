import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES, USER_ROLES } from "@/models";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const page = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100_000).default(1));
const limit = z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).default(20));
const queryText = z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional());

export const adminProductListQuerySchema = z
  .object({
    q: queryText,
    status: z.preprocess(emptyToUndefined, z.enum(["all", "active", "inactive"]).default("all")),
    stock: z.preprocess(
      emptyToUndefined,
      z.enum(["all", "in_stock", "low", "out_of_stock"]).default("all"),
    ),
    sort: z.preprocess(
      emptyToUndefined,
      z.enum(["newest", "name", "stock_asc", "stock_desc"]).default("newest"),
    ),
    page,
    limit,
  })
  .strict();

export const adminOrderListQuerySchema = z
  .object({
    q: queryText,
    status: z.preprocess(emptyToUndefined, z.enum(ORDER_STATUSES).optional()),
    paymentStatus: z.preprocess(emptyToUndefined, z.enum(PAYMENT_STATUSES).optional()),
    sort: z.preprocess(emptyToUndefined, z.enum(["newest", "oldest"]).default("newest")),
    page,
    limit,
  })
  .strict();

export const adminUserListQuerySchema = z
  .object({
    q: queryText,
    role: z.preprocess(emptyToUndefined, z.enum(USER_ROLES).optional()),
    sort: z.preprocess(emptyToUndefined, z.enum(["newest", "oldest", "name"]).default("newest")),
    page,
    limit,
  })
  .strict();

export const updateAdminOrderStatusSchema = z
  .object({ orderStatus: z.enum(ORDER_STATUSES) })
  .strict();

export const updateAdminStockSchema = z
  .object({ stock: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER) })
  .strict();

export type AdminProductListQuery = z.infer<typeof adminProductListQuerySchema>;
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
