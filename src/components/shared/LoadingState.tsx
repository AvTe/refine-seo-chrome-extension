export default function LoadingState() {
  return (
    <div className="flex-1 p-6 animate-fade-in">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="h-6 w-32 bg-surface-2 rounded animate-pulse" />
        <div className="h-4 w-48 bg-surface-2 rounded animate-pulse" />

        {/* Score cards skeleton */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card">
              <div className="h-3 w-16 bg-surface-2 rounded animate-pulse" />
              <div className="h-8 w-12 bg-surface-2 rounded animate-pulse mt-2" />
              <div className="h-2 w-full bg-surface-2 rounded animate-pulse mt-3" />
            </div>
          ))}
        </div>

        {/* Section skeleton */}
        <div className="card mt-4">
          <div className="h-4 w-24 bg-surface-2 rounded animate-pulse" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 bg-surface-2 rounded animate-pulse" style={{ width: `${40 + i * 10}%` }} />
                <div className="h-5 w-16 bg-surface-2 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
