export function PageLoadingSkeleton({ admin = false }: { admin?: boolean }) {
  return (
    <div aria-busy="true" aria-live="polite" className={`min-h-[70vh] bg-background px-4 py-10 sm:px-6 lg:px-8 ${admin ? "lg:py-12" : ""}`}>
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className={`h-40 rounded-[1.75rem] ${admin ? "bg-domify-warm-white" : "bg-domify-primary-dark/10"}`} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden min-h-72 rounded-[1.35rem] bg-domify-warm-white lg:block" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="overflow-hidden rounded-[1.35rem] border border-domify-dark/8 bg-white shadow-luxury">
                <div className="h-52 bg-domify-warm-white" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/3 rounded-full bg-domify-dark/10" />
                  <div className="h-5 w-4/5 rounded-full bg-domify-dark/10" />
                  <div className="h-4 w-2/5 rounded-full bg-domify-gold/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
