import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { HeroSearch } from "@/components/marketing/hero-search";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/format";
import { missedCallCostPerMonthCents, pricingTiers } from "@/lib/marketing";
import type { MarketplaceCategory, MarketplaceLocation } from "@/lib/api";

/** One line of the docket: pre-printed label, typed value. */
function DocketLine({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-[6.5rem_1fr] items-baseline gap-3 border-b border-dotted py-2 last:border-b-0 ${className ?? ""}`}
    >
      <dt className="field-label">{label}</dt>
      <dd className="typed text-sm">{children}</dd>
    </div>
  );
}

export function Hero({
  categories,
  locations,
}: {
  categories: MarketplaceCategory[];
  locations: MarketplaceLocation[];
}) {
  const entryPrice = pricingTiers[0].priceCents;
  const cheapestJob = Math.min(
    ...categories.map((category) => category.from_price_cents),
  );

  return (
    <section className="border-b">
      <div className="mx-auto grid w-full max-w-[86rem] gap-14 px-4 py-14 sm:px-8 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <p className="field-label">
            AI front desk · Irish trades · since 2023
          </p>

          <h1 className="display mt-5 text-[clamp(2.6rem,1.4rem+5vw,5.25rem)]">
            Answered at 6.12.
            <br />
            <span className="marker">Booked by 6.14.</span>
          </h1>

          <p className="mt-6 max-w-[52ch] text-lg">
            TradeDesk AI picks up when you can&apos;t, takes the details, and
            puts the job in your diary — then texts the customer to confirm. You
            get the docket.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free for 14 days
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#find">I need a tradesman</Link>
            </Button>
          </div>
          <p className="text-muted-foreground mt-3 text-sm">
            No setup fee, no contract, from {formatEuro(entryPrice)} a month.
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-7 border-t pt-8 sm:grid-cols-4">
            {[
              {
                label: "Lost to missed calls",
                value: formatEuro(missedCallCostPerMonthCents),
                unit: "/mo",
              },
              { label: "Calls answered", value: "24/7", unit: "" },
              { label: "Verified trades", value: "1,200", unit: "+" },
              { label: "Jobs from", value: formatEuro(cheapestJob), unit: "" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="field-label min-h-8">{stat.label}</dt>
                <dd className="typed mt-1 text-2xl font-bold sm:text-[1.75rem]">
                  {stat.value}
                  {stat.unit ? (
                    <span className="text-muted-foreground text-sm font-normal">
                      {stat.unit}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/*
          The signature: the docket the AI fills in. It is the product's actual
          output, so the hero shows the thing rather than describing it.
        */}
        <div className="lg:pt-10">
          <div className="docket relative mt-1.5 px-5 pt-7 pb-6 shadow-[0_1px_0_var(--border),0_18px_40px_-28px_rgba(25,23,19,0.5)] sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="field-label">Job docket</p>
                <p className="typed mt-1 text-lg font-bold">No. 0142</p>
              </div>
              <span className="stamp border-primary text-primary">Booked</span>
            </div>

            <dl className="mt-6 border-t border-dotted">
              <DocketLine label="Rang">06:12 · Mon 1 Sep</DocketLine>
              <DocketLine label="Caller">
                Aoife Byrne · +353 87 123 4501
              </DocketLine>
              <DocketLine label="Job">
                Burst pipe — water through the kitchen ceiling
              </DocketLine>
              <DocketLine label="Mains">Off at the stopcock</DocketLine>
              <DocketLine label="Urgency">Emergency</DocketLine>
              <DocketLine label="Booked">
                <span className="marker font-bold">Today, 14:00–16:00</span>
              </DocketLine>
              <DocketLine label="Confirmed">WhatsApp · 06:14</DocketLine>
              <DocketLine label="Handled by">
                TradeDesk AI · no human touched it
              </DocketLine>
            </dl>

            <p className="text-muted-foreground mt-7 border-t pt-4 text-xs">
              Every call the AI answers arrives like this — in your dashboard
              before you&apos;re back in the van.
            </p>
          </div>

          {/* The homeowner's way in, kept beside the docket rather than buried. */}
          <div id="find" className="mt-8 border-t pt-8">
            <p className="field-label">Looking for a tradesman?</p>
            <p className="mt-2 text-sm">
              Browse verified plumbers, electricians and handymen near you. No
              sign-up, no forms until you&apos;ve seen who&apos;s available.
            </p>
            <div className="mt-5">
              <HeroSearch categories={categories} locations={locations} />
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {[
                { href: "/find/plumber/naas", label: "Plumbers in Naas" },
                {
                  href: "/find/electrician/newbridge",
                  label: "Electricians in Newbridge",
                },
                {
                  href: "/find/heating_engineer/swords",
                  label: "Heating in Swords",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-primary rounded underline underline-offset-4 hover:no-underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
