import { PageSkeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <section className="px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <PageSkeleton variant="form" />
    </section>
  );
}
