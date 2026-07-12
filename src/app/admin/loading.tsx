export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-40 rounded-lg bg-muted" />
        <div className="h-4 w-52 rounded-lg bg-muted mt-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card p-5 space-y-3"
          >
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-5 w-5 rounded bg-muted" />
            </div>
            <div className="h-8 w-20 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="h-6 w-32 rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}
