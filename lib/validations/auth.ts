import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "密码至少需要 8 个字符")
  .refine((password) => new TextEncoder().encode(password).byteLength <= 72, {
    message: "密码的 UTF-8 长度不能超过 72 字节",
  })
  .regex(/[a-z]/, "密码至少需要一个小写字母")
  .regex(/[A-Z]/, "密码至少需要一个大写字母")
  .regex(/[0-9]/, "密码至少需要一个数字");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "姓名至少需要 2 个字符").max(100, "姓名不能超过 100 个字符"),
    email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址").max(254),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("请输入有效的邮箱地址").max(254),
    password: z
      .string()
      .min(1, "请输入密码")
      .refine((password) => new TextEncoder().encode(password).byteLength <= 72, {
        message: "密码的 UTF-8 长度不能超过 72 字节",
      }),
  })
  .strict();

export function getValidationErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "_form");
    details[field] = [...(details[field] ?? []), issue.message];
  }

  return details;
}
