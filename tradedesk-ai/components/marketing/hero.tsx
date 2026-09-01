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
  { icon: CalendarCheck, text: "Books into hours you actually work" },
  {
    icon: MessageCircle,
    text: "Confirms on WhatsApp or SMS before they hang up",
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
  // Quote the cheapest trade rather than a number that can drift from the grid.
  const cheapestJob = Math.min(
    ...categories.map((category) => category.from_price_cents),
  );

  const stats = [
    {
      label: "Lost to missed calls",
      value: formatEuro(missedCallCostPerMonthCents),
      unit: "/ mo",
    },
    { label: "Calls answered", value: "24/7", unit: "" },
    { label: "From", value: formatEuro(entryPrice), unit: "/ mo" },
    { label: "Verified trades", value: "1,200", unit: "+" },
  ];

  return (
    <section className="relative isolate overflow-hidden">
      {/* Blueprint grid and two blooms of accent light. */}
      <div
        aria-hidden
        className="dot-grid pointer-events-none absolute inset-0 opacity-[0.35]"
      />
      <div
        aria-hidden
        className="brand-glow pointer-events-none absolute -top-40 -right-32 h-[34rem] w-[34rem] opacity-70"
      />
      <div
        aria-hidden
        className="brand-glow pointer-events-none absolute -bottom-56 -left-40 h-[32rem] w-[32rem] opacity-40"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pt-16 pb-14 sm:px-8 md:pt-24 md:pb-20">
        <p className="kicker text-gradient">Built in Ireland for trades</p>

        <h1 className="display mt-5 text-5xl sm:text-7xl lg:text-8xl">
          Every call answered.
          <br />
          <span className="text-gradient">Every job booked.</span>
        </h1>

        <p className="text-muted-foreground mt-6 max-w-2xl text-lg">
          TradeDesk AI picks up the phone when you can&apos;t, books the job
          into your calendar, and texts the customer to confirm. Homeowners get
          somewhere to find a tradesman who actually answers.
        </p>

        {/* Stat strip, in the style of a workout readout: label over value. */}
        <dl className="mt-12 grid grid-cols-2 gap-y-8 border-y border-white/10 py-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="lg:border-r lg:border-white/10 lg:last:border-0 lg:pr-6"
            >
              {/* Fixed label height so wrapped labels don't stagger the numbers. */}
              <dt className="kicker text-muted-foreground min-h-[2.2rem]">
                {stat.label}
              </dt>
              <dd className="display mt-2 text-4xl sm:text-5xl">
                {stat.value}
                {stat.unit ? (
                  <span className="text-muted-foreground ml-1.5 text-base font-semibold tracking-normal">
                    {stat.unit}
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>

        {/* Both audiences, equal weight, above the fold. */}
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
            <p className="kicker text-muted-foreground">I need a tradesman</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Find one who answers
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">
              Verified plumbers, electricians and handymen near you, with prices
              from{" "}
              <strong className="text-foreground">
                {formatEuro(cheapestJob)}
              </strong>
              . No sign-up and no forms until you&apos;ve seen who&apos;s
              available.
            </p>

            <div className="mt-6">
              <HeroSearch categories={categories} locations={locations} />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground text-xs tracking-wide uppercase">
                Popular
              </span>
              {popularSearches.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-foreground text-muted-foreground rounded underline-offset-4 transition-colors hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* The trade side gets the accent, since it's the side that pays. */}
          <div className="from-brand-from/25 via-brand-via/15 to-brand-to/25 relative overflow-hidden rounded-2xl bg-linear-140 p-px">
            <div className="bg-background/80 h-full rounded-[calc(1.25rem-1px)] p-6 backdrop-blur-sm sm:p-8">
              <p className="kicker text-gradient">I am a tradesman</p>
              <h2 className="display mt-3 text-3xl sm:text-4xl">
                Stop losing jobs to voicemail
              </h2>
              <p className="text-muted-foreground mt-3 text-sm">
                Three missed calls a week is about{" "}
                <strong className="text-foreground">
                  {formatEuro(missedCallCostPerMonthCents)} a month
                </strong>{" "}
                of work going to whoever answers next.
              </p>

              <ul className="mt-6 space-y-3">
                {tradeBullets.map((bullet) => (
                  <li
                    key={bullet.text}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="from-brand-from via-brand-via to-brand-to mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-100 text-white">
                      <bullet.icon className="size-3.5" aria-hidden />
                    </span>
                    <span>{bullet.text}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild variant="invert" size="lg">
                  <Link href="/signup">
                    Start free for 14 days
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#pricing">
                    From {formatEuro(entryPrice)} a month
                  </Link>
                </Button>
              </div>
              <p className="text-muted-foreground mt-4 text-xs">
                No setup fee. No contract. Cancel inside month one and we refund
                it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
