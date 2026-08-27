import { PageSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="min-h-[75vh] bg-stone-100 px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
      <PageSkeleton />
    </section>
  );
}
