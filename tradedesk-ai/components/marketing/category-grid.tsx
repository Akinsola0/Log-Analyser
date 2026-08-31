import Link from "next/link";

import { CategoryIcon } from "@/components/marketing/category-icon";
import { formatEuro } from "@/lib/format";
import type { MarketplaceCategory } from "@/lib/api";

/**
 * Category-first browsing with the indicative price shown up front — a homeowner
 * can see roughly what a job costs before they talk to anybody.
 */
export function CategoryGrid({
  categories,
  defaultLocation,
}: {
  categories: MarketplaceCategory[];
  /** Where the grid sends people before they pick a town of their own. */
  defaultLocation: string;
}) {
  return (
    <section
      id="browse"
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Browse by trade
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Indicative prices from tradespeople on TradeDesk AI. Real quote
            comes from them — but you shouldn&apos;t have to ring five people to
            find out the going rate.
          </p>
        </div>
        <Link
          href="/find"
          className="text-primary rounded text-sm font-medium underline-offset-4 hover:underline"
        >
          See all trades and towns
        </Link>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/find/${category.slug}/${defaultLocation}`}
              className="group bg-card hover:border-primary/40 flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors"
            >
              <span className="bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg">
                <CategoryIcon name={category.icon} className="size-5" />
              </span>
              <span className="mt-1 font-medium">{category.label}</span>
              <span className="text-muted-foreground text-sm">
                From {formatEuro(category.from_price_cents)}
              </span>
              <span className="text-muted-foreground mt-auto pt-2 text-xs">
                {category.listing_count} verified{" "}
                {category.plural.toLowerCase()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
