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
        <section className="bg-brand-navy text-brand-navy-foreground">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Find a tradesman who answers
            </h1>
            <p className="mt-2 max-w-2xl text-white/75">
              Every tradesman here has an AI front desk on their phone, so your
              call gets picked up — even at seven on a Sunday morning. Browse
              first; you only leave your details when you&apos;ve picked
              someone.
            </p>

            <div className="bg-background text-foreground mt-6 rounded-xl p-5">
              <HeroSearch categories={categories} locations={locations} />
            </div>
          </div>
        </section>

        <TrustStrip />

        <CategoryGrid
          categories={categories}
          defaultLocation={locations[0]?.slug ?? "naas"}
        />

        <section className="border-t">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              Towns we cover
            </h2>
            <p className="text-muted-foreground mt-2">
              More towns as trades sign up. Links go to plumbers — swap the
              trade once you&apos;re there.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {locations.map((location) => (
                <li key={location.slug}>
                  <Link
                    href={`/find/plumber/${location.slug}`}
                    className="hover:border-primary/40 block rounded-lg border px-3 py-2 text-sm transition-colors"
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
