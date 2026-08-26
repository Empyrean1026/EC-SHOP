import { z } from "zod";

export function getValidationErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "_form");
    details[field] = [...(details[field] ?? []), issue.message];
  }

  return details;
}
