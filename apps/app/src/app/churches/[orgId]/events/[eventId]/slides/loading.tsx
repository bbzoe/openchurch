import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full max-w-lg rounded-full" />
      <Skeleton className="aspect-video w-full rounded-2xl" />
    </main>
  );
}
