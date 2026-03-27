import { Skeleton } from "@/components/ui/skeleton";

function FeedCardSkeleton() {
  return (
    <div className="motion-rise border-b border-white/10 p-5">
      <div className="flex gap-4">
        <Skeleton className="h-14 w-14 rounded-[14px]" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-48 w-full rounded-[18px]" />
          <div className="flex gap-6 pt-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ withHeader = false, count = 3 }) {
  return (
    <div className="space-y-2">
      {withHeader ? (
        <section className="panel panel-reveal p-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-3 h-4 w-72" />
        </section>
      ) : null}
      <div className="panel-reveal overflow-hidden rounded-[18px] border border-white/10 bg-[#151313]">
        {Array.from({ length: count }).map((_, index) => (
          <FeedCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <section className="panel panel-reveal overflow-hidden">
        <Skeleton className="h-44 w-full rounded-none" />
        <div className="p-6">
          <div className="-mt-16 flex items-end justify-between">
            <Skeleton className="h-20 w-20 rounded-[18px]" />
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="mt-5 h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-32" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-3/4" />
        </div>
      </section>
      <FeedSkeleton count={2} />
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="space-y-4">
      <FeedSkeleton count={1} />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <section key={index} className="panel panel-reveal p-4">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-[12px]" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <section key={index} className="panel panel-reveal p-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-[12px]" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <section key={index} className="panel panel-reveal p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-[14px]" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <section className="panel panel-reveal p-6">
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-3 h-4 w-80" />
      <div className="mt-8 grid gap-8">
        {Array.from({ length: 3 }).map((_, blockIndex) => (
          <div key={blockIndex} className="space-y-4 border-t border-white/10 pt-8 first:border-t-0 first:pt-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function AdminSkeleton() {
  return (
    <div className="space-y-8">
      <section className="panel p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-96" />
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <section key={index} className="panel panel-reveal p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-4 h-8 w-24" />
          </section>
        ))}
      </div>
      <section className="panel panel-reveal p-5">
        <Skeleton className="mb-4 h-6 w-32" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="mb-3 h-10 w-full last:mb-0" />
        ))}
      </section>
    </div>
  );
}
