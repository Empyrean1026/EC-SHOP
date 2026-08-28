"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AccountError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} scope="アカウント情報" />;
}
