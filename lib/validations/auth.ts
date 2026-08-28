import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .refine((password) => new TextEncoder().encode(password).byteLength <= 72, {
    message: "パスワードはUTF-8で72バイト以内にしてください",
  })
  .regex(/[a-z]/, "パスワードには英小文字を1文字以上含めてください")
  .regex(/[A-Z]/, "パスワードには英大文字を1文字以上含めてください")
  .regex(/[0-9]/, "パスワードには数字を1文字以上含めてください");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "氏名は2文字以上で入力してください")
      .max(100, "氏名は100文字以内で入力してください"),
    email: z.string().trim().toLowerCase().email("有効なメールアドレスを入力してください").max(254),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "確認用パスワードが一致しません",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("有効なメールアドレスを入力してください").max(254),
    password: z
      .string()
      .min(1, "パスワードを入力してください")
      .refine((password) => new TextEncoder().encode(password).byteLength <= 72, {
        message: "パスワードはUTF-8で72バイト以内にしてください",
      }),
  })
  .strict();
