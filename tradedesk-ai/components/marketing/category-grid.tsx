import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

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
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 md:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-muted-foreground">The marketplace</p>
          <h2 className="display mt-3 text-4xl sm:text-5xl">Browse by trade</h2>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            Indicative prices from tradespeople on TradeDesk AI. The real quote
            comes from them — but you shouldn&apos;t have to ring five people to
            find out the going rate.
          </p>
        </div>
        <Link
          href="/find"
          className="text-foreground group inline-flex items-center gap-1.5 rounded text-sm font-semibold tracking-wide uppercase underline-offset-4 hover:underline"
        >
          All trades and towns
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/find/${category.slug}/${defaultLocation}`}
              className="group hover:border-brand-via/40 relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors"
            >
              <span
                aria-hidden
                className="brand-glow pointer-events-none absolute -top-16 -right-10 h-32 w-32 opacity-0 transition-opacity group-hover:opacity-60"
              />
              <span className="text-brand-via relative">
                <CategoryIcon name={category.icon} className="size-6" />
              </span>
              <span className="relative mt-2 font-semibold">
                {category.label}
              </span>
              <span className="relative">
                <span className="kicker text-muted-foreground block text-[0.6rem]">
                  From
                </span>
                <span className="display mt-1 block text-2xl">
                  {formatEuro(category.from_price_cents)}
                </span>
              </span>
              <span className="text-muted-foreground relative mt-auto pt-2 text-xs">
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
