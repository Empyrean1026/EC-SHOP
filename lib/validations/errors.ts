import { z } from "zod";

export function getValidationErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "_form";
    details[field] = [...(details[field] ?? []), issue.message];
  }

  return details;
}
