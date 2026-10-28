import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="min-h-svh bg-forest px-6 py-10">
      <Skeleton className="h-4 w-40 bg-white/15" />
      <Skeleton className="mt-3 h-4 w-28 bg-white/15" />
      <Skeleton className="mt-10 h-16 w-2/3 bg-white/15" />
      <Skeleton className="mt-4 h-6 w-24 bg-white/10" />
    </main>
  );
}
