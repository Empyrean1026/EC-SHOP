export function buildAdminPageUrl(
  path: string,
  query: Record<string, string | number | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries({ ...query, page })) {
    if (value !== undefined && (typeof value === "number" || (value !== "" && value !== "all"))) {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
