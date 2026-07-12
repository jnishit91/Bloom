export default function HomeLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-10 animate-pulse">
        {/* Welcome skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-72 rounded-lg bg-muted" />
          <div className="h-5 w-96 rounded-lg bg-muted" />
        </div>

        {/* Continue Learning skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-44 rounded-lg bg-muted" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-bloom bg-white border border-border overflow-hidden"
              >
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-1.5 rounded-full bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
