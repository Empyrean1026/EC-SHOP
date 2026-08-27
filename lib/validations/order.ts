import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/models/constants";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const ORDER_SORT_VALUES = ["newest", "oldest"] as const;

export const orderListQuerySchema = z
  .object({
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100_000).default(1)),
    limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(50).default(10)),
    status: z.preprocess(emptyToUndefined, z.enum(ORDER_STATUSES).optional()),
    paymentStatus: z.preprocess(emptyToUndefined, z.enum(PAYMENT_STATUSES).optional()),
    sort: z.preprocess(emptyToUndefined, z.enum(ORDER_SORT_VALUES).default("newest")),
  })
  .strict();

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;
