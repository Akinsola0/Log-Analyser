import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  MessageCircle,
  PhoneCall,
} from "lucide-react";

import { HeroSearch } from "@/components/marketing/hero-search";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/format";
import { missedCallCostPerMonthCents, pricingTiers } from "@/lib/marketing";
import type { MarketplaceCategory, MarketplaceLocation } from "@/lib/api";

const popularSearches = [
  { href: "/find/plumber/naas", label: "Plumbers in Naas" },
  { href: "/find/electrician/newbridge", label: "Electricians in Newbridge" },
  { href: "/find/heating_engineer/swords", label: "Heating in Swords" },
];

const tradeBullets = [
  { icon: PhoneCall, text: "Answers every call, including the 7am burst pipe" },
  { icon: CalendarCheck, text: "Books the job into hours you actually work" },
  {
    icon: MessageCircle,
    text: "Confirms it on WhatsApp or SMS before they hang up",
  },
];

export function Hero({
  categories,
  locations,
}: {
  categories: MarketplaceCategory[];
  locations: MarketplaceLocation[];
}) {
  const entryPrice = pricingTiers[0].priceCents;

  return (
    <section className="bg-brand-navy text-brand-navy-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="max-w-3xl">
          <p className="text-brand-amber text-sm font-semibold tracking-wide uppercase">
            Built in Ireland for trades
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Every call answered. Every job booked.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            TradeDesk AI picks up the phone when you can&apos;t, books the job
            into your calendar, and texts the customer to confirm. Homeowners
            get somewhere to find a tradesman who actually answers.
          </p>
        </div>

        {/* Both audiences get equal space, from the first screen. */}
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <div className="bg-background text-foreground rounded-xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">I need a tradesman</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Browse verified plumbers, electricians and handymen near you, with
              prices from <strong className="text-foreground">€60</strong>. No
              sign-up and no forms until you&apos;ve seen who&apos;s available.
            </p>

            <div className="mt-5">
              <HeroSearch categories={categories} locations={locations} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="text-muted-foreground">Popular:</span>
              {popularSearches.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-primary rounded underline-offset-4 hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-background text-foreground rounded-xl border border-white/10 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">I am a tradesman</h2>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Three missed calls a week is about{" "}
              <strong className="text-foreground">
                {formatEuro(missedCallCostPerMonthCents)} a month
              </strong>{" "}
              of work going to whoever answers next.
            </p>

            <ul className="mt-5 space-y-3">
              {tradeBullets.map((bullet) => (
                <li
                  key={bullet.text}
                  className="flex items-start gap-3 text-sm"
                >
                  <span className="bg-accent text-accent-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md">
                    <bullet.icon className="size-4" aria-hidden />
                  </span>
                  <span>{bullet.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/signup">
                  Start free for 14 days
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="#pricing">
                  From {formatEuro(entryPrice)} a month
                </Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              No setup fee. No contract. Cancel inside month one and we refund
              it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
