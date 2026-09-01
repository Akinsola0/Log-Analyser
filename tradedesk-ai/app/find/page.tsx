import type { Metadata } from "next";
import Link from "next/link";

import { CategoryGrid } from "@/components/marketing/category-grid";
import { HeroSearch } from "@/components/marketing/hero-search";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getCategories, getLocations } from "@/lib/api";

export const metadata: Metadata = {
  title: "Find a tradesman",
  description:
    "Browse verified plumbers, electricians, handymen and more across Ireland, with indicative prices and reviews from real jobs.",
};

export default async function FindIndexPage() {
  const [categories, locations] = await Promise.all([
    getCategories(),
    getLocations(),
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="relative isolate overflow-hidden border-b border-white/10">
          <div
            aria-hidden
            className="dot-grid pointer-events-none absolute inset-0 opacity-30"
          />
          <div
            aria-hidden
            className="brand-glow pointer-events-none absolute -top-32 right-0 h-96 w-96 opacity-50"
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
            <p className="kicker text-gradient">The marketplace</p>
            <h1 className="display mt-4 text-5xl sm:text-6xl">
              Find a tradesman who answers
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl">
              Every tradesman here has an AI front desk on their phone, so your
              call gets picked up — even at seven on a Sunday morning. Browse
              first; you only leave your details when you&apos;ve picked
              someone.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm sm:p-6">
              <HeroSearch categories={categories} locations={locations} />
            </div>
          </div>
        </section>

        <TrustStrip />

        <CategoryGrid
          categories={categories}
          defaultLocation={locations[0]?.slug ?? "naas"}
        />

        <section className="border-t border-white/10">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
            <h2 className="display text-4xl">Towns we cover</h2>
            <p className="text-muted-foreground mt-3">
              More towns as trades sign up. Links go to plumbers — swap the
              trade once you&apos;re there.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {locations.map((location) => (
                <li key={location.slug}>
                  <Link
                    href={`/find/plumber/${location.slug}`}
                    className="hover:border-brand-via/40 block rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm transition-colors"
                  >
                    <span className="font-medium">{location.town}</span>
                    <span className="text-muted-foreground block text-xs">
                      Co. {location.county}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
