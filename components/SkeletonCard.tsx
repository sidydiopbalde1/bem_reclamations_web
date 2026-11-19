export function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="skeleton h-4 w-12 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-14 rounded" />
        </div>
      </div>
      <div className="skeleton h-4 w-32 rounded mb-2" />
      <div className="skeleton h-3 w-full rounded mb-1.5" />
      <div className="skeleton h-3 w-3/4 rounded mb-4" />
      <div className="flex gap-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  );
}
