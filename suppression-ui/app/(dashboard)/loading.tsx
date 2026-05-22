"use client";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 pb-12 animate-pulse">
      {/* KPI Strip Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border rounded-xl p-4 h-36"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="h-3 w-20 bg-border rounded" />
              <div className="h-4 w-4 bg-border rounded" />
            </div>
            <div className="h-8 w-24 bg-border rounded mb-2" />
            <div className="h-2 w-16 bg-border rounded" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-6 w-32 bg-border rounded mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-6 h-32"
              >
                <div className="h-4 w-28 bg-border rounded mb-3" />
                <div className="h-3 w-48 bg-border rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl h-64" />
      </div>
    </div>
  );
}
