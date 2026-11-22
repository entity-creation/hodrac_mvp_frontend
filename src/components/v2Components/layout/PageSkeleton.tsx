// Shown while a page's code downloads (the Suspense fallback around routes).
// Matches the loading screen in index.html, minus the nav bar, which is real
// by then, so the hand-over from the static screen doesn't jump.
export default function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-5 pt-4 pb-16 motion-safe:animate-pulse" role="status" aria-label="Loading">
      <div className="rounded-3xl bg-cream-deep h-[min(52vh,460px)] mb-8" />
      <div className="h-4 rounded-lg bg-cream-deep w-2/5 mb-3" />
      <div className="h-4 rounded-lg bg-cream-deep w-[65%]" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 mt-8">
        {[0, 1, 2].map(i => <div key={i} className="rounded-3xl bg-cream-deep h-[280px]" />)}
      </div>
    </div>
  );
}
