"use client";

import { useMemo, useState } from "react";
import { MarketplaceCard } from "./marketplace-card";
import { marketplaceCategories, marketplaceItems, type MarketplaceCategory, type MarketplaceItem } from "./data";
import { MarketplaceDetail } from "./marketplace-detail";
import { MarketplaceEmpty } from "./marketplace-states";

type SortOption = "featured" | "price-low" | "price-high" | "name";

export function MarketplaceBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | MarketplaceCategory>("All");
  const [sort, setSort] = useState<SortOption>("featured");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = marketplaceItems.filter((item) => {
      const matchesQuery = !normalizedQuery || [item.name, item.collection, item.creator].some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesQuery && (category === "All" || item.category === category);
    });

    return [...items].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return marketplaceItems.indexOf(a) - marketplaceItems.indexOf(b);
    });
  }, [category, query, sort]);

  return (
    <>
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 pb-10 pt-32 sm:px-8 sm:pb-14 sm:pt-36 lg:px-10">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The marketplace</p>
          <div className="mt-4 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Find something<br /><span className="text-primary">worth keeping.</span></h1>
              <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">Explore digital works from independent creators and discover pieces that belong in your collection.</p>
            </div>
            <p className="text-xs text-muted-foreground">Showing local demonstration content</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-14 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block w-full lg:max-w-md">
            <span className="sr-only">Search marketplace</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, collection, or creator" className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-ring focus:ring-2 focus:ring-ring/20" />
          </label>
          <label className="flex h-12 items-center gap-3 rounded-xl border border-input bg-card px-4 text-sm">
            <span className="text-muted-foreground">Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)} className="bg-transparent font-medium outline-none">
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
          {marketplaceCategories.map((itemCategory) => (
            <button key={itemCategory} type="button" onClick={() => setCategory(itemCategory)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors ${category === itemCategory ? "bg-foreground text-background" : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {itemCategory}
            </button>
          ))}
        </div>
        <div className="mb-5 mt-10 flex items-center justify-between">
          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{filteredItems.length}</span> assets</p>
          <p className="text-xs text-muted-foreground">Prices shown in SOL</p>
        </div>
        {filteredItems.length === 0 ? <MarketplaceEmpty /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filteredItems.map((item) => <MarketplaceCard key={item.id} item={item} onSelect={setSelectedItem} />)}</div>}
      </main>
      {selectedItem && <MarketplaceDetail item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </>
  );
}
