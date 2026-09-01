import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { CategoryIcon } from "@/components/marketing/category-icon";
import { formatEuro } from "@/lib/format";
import type { MarketplaceCategory } from "@/lib/api";

/**
 * Category-first browsing with the indicative price shown up front — a
 * homeowner can see roughly what a job costs before talking to anybody.
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
    <section id="browse" className="border-t">
      <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-8 md:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="field-label">The marketplace</p>
            <h2 className="display mt-4 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)]">
              Browse by trade
            </h2>
            <p className="text-muted-foreground mt-4 max-w-[54ch]">
              Indicative prices from tradespeople on TradeDesk AI. The real
              quote comes from them — but you shouldn&apos;t have to ring five
              people to find out the going rate.
            </p>
          </div>
          <Link
            href="/find"
            className="text-primary group inline-flex items-center gap-1.5 rounded font-semibold underline underline-offset-4 hover:no-underline"
          >
            All trades and towns
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ul className="mt-10 grid gap-px border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/find/${category.slug}/${defaultLocation}`}
                className="bg-background hover:bg-card flex h-full flex-col gap-3 p-6 transition-colors"
              >
                <CategoryIcon
                  name={category.icon}
                  className="text-primary size-5"
                />
                <span className="display mt-1 text-xl">{category.label}</span>
                <span>
                  <span className="field-label">From</span>
                  <span className="typed mt-0.5 block text-2xl font-bold">
                    {formatEuro(category.from_price_cents)}
                  </span>
                </span>
                <span className="text-muted-foreground mt-auto pt-3 text-xs">
                  {category.listing_count} verified{" "}
                  {category.plural.toLowerCase()}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
