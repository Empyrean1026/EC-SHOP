"use client";

import { RouteError } from "@/components/ui/route-error";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <RouteError error={error} retry={retry} scope="管理员数据" />;
}
