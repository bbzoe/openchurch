import { Skeleton } from "@/components/skeleton";

export default function Loading() {
  return (
    <main className="flex w-full flex-col gap-4 px-6 py-6">
      <div className="flex items-end justify-between gap-3">
        <div className="grid gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="rounded-2xl bg-card p-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="ml-auto h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </main>
  );
}
