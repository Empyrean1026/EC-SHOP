import { z } from "zod";
import { CURRENCY_CODES } from "@/models";
import { isHttpOrPublicAssetUrl } from "@/models/validators";
import {
  PRODUCT_MAX_PAGE_SIZE,
  PRODUCT_PAGE_SIZE,
  PRODUCT_SORT_VALUES,
} from "@/lib/products/constants";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "カテゴリーIDの形式が正しくありません");
const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;
const optionalText = (maximum: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().min(1).max(maximum).optional());
const optionalInteger = (minimum: number, maximum: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(minimum).max(maximum).optional());
const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    isHttpOrPublicAssetUrl,
    "画像URLには HTTP、HTTPS、または安全なサイト内パスを使用してください",
  );

export const productListQuerySchema = z
  .object({
    q: optionalText(100),
    category: optionalText(120),
    page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100_000).default(1)),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(PRODUCT_MAX_PAGE_SIZE).default(PRODUCT_PAGE_SIZE),
    ),
    minPrice: optionalInteger(0, Number.MAX_SAFE_INTEGER),
    maxPrice: optionalInteger(0, Number.MAX_SAFE_INTEGER),
    currency: z.preprocess(emptyToUndefined, z.enum(CURRENCY_CODES).optional()),
    inStock: z.preprocess(
      emptyToUndefined,
      z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
    ),
    sort: z.preprocess(emptyToUndefined, z.enum(PRODUCT_SORT_VALUES).default("newest")),
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    {
      message: "最低価格は最高価格以下にしてください",
      path: ["minPrice"],
    },
  );

const productFields = {
  name: z.string().trim().min(2, "商品名は2文字以上で入力してください").max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug は2文字以上で入力してください")
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug には英小文字、数字、ハイフンのみ使用できます"),
  description: z.string().trim().min(10, "商品説明は10文字以上で入力してください").max(10_000),
  price: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  currency: z.enum(CURRENCY_CODES).default("jpy"),
  categoryId: objectIdSchema,
  images: z.array(imageUrlSchema).max(12).default([]),
  stock: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  isActive: z.boolean().default(true),
};

export const createProductSchema = z.object(productFields).strict();

export const updateProductSchema = z
  .object({
    name: productFields.name.optional(),
    slug: productFields.slug.optional(),
    description: productFields.description.optional(),
    price: productFields.price.optional(),
    currency: z.enum(CURRENCY_CODES).optional(),
    categoryId: productFields.categoryId.optional(),
    images: z.array(imageUrlSchema).max(12).optional(),
    stock: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "更新する項目を1つ以上指定してください",
  });

export const productIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "商品IDの形式が正しくありません");
export const productIdentifierSchema = z.union([
  productIdSchema,
  z
    .string()
    .min(2)
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "商品識別子の形式が正しくありません"),
]);

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
