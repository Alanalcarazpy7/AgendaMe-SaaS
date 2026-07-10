import { Skeleton } from "@/components/ui/skeleton";

export default function ReservasLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/90">
        <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-border/80 bg-card/90 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <Skeleton className="h-11 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/90">
        <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </section>
    </div>
  );
}
