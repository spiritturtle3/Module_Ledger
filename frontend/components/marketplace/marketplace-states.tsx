export function MarketplaceLoading() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="animate-pulse rounded-2xl border border-border bg-card p-2">
          <div className="aspect-[1.08] rounded-xl bg-muted" />
          <div className="space-y-3 p-3"><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-3 w-1/3 rounded bg-muted" /><div className="h-8 rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  );
}

export function MarketplaceEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent text-xl text-accent-foreground">⌕</span>
      <h2 className="mt-5 text-lg font-semibold">Nothing matches your search</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Try a different name, collection, or category to explore the demonstration catalog.</p>
    </div>
  );
}

export function MarketplaceError() {
  return (
    <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">Marketplace unavailable</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">We couldn&apos;t load the marketplace catalog. Please try again later.</p>
    </div>
  );
}
