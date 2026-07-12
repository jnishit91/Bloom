export default function CoursesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-lg bg-muted" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-bloom bg-white border border-border overflow-hidden"
            >
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-6 w-3/4 rounded bg-muted" />
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
