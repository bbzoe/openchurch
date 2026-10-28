import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
    </main>
  );
}
