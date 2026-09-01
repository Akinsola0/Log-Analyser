import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/format";
import { pricingTiers } from "@/lib/marketing";
import { cn } from "@/lib/utils";

/**
 * Pricing is on the homepage, in numbers, with no "book a demo" in front of it —
 * the one thing every competitor we looked at hides.
 */
export function Pricing() {
  return (
    <section
      id="pricing"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 md:py-24"
    >
      <div className="max-w-3xl">
        <p className="kicker text-muted-foreground">Pricing</p>
        <h2 className="display mt-3 text-4xl sm:text-5xl lg:text-6xl">
          On the page, where it should be
        </h2>
        <p className="text-muted-foreground mt-4">
          One booked job a month covers Starter. Every plan includes a profile
          in the homeowner marketplace, and there is no setup fee.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "relative flex flex-col rounded-2xl p-px",
              tier.featured
                ? "from-brand-from via-brand-via to-brand-to bg-linear-140"
                : "bg-white/10",
            )}
          >
            <div
              className={cn(
                "flex h-full flex-col rounded-[calc(1.25rem-1px)] p-7",
                tier.featured ? "bg-background" : "bg-card",
              )}
            >
              {tier.featured ? (
                <span className="from-brand-from via-brand-via to-brand-to absolute -top-3 left-7 rounded-full bg-linear-100 px-3 py-1 text-[0.65rem] font-bold tracking-[0.14em] text-white uppercase">
                  Most popular
                </span>
              ) : null}

              <h3 className="kicker text-muted-foreground">{tier.name}</h3>
              <p className="display mt-4 text-5xl">
                {formatEuro(tier.priceCents)}
                <span className="text-muted-foreground ml-1.5 text-sm font-semibold tracking-normal">
                  / mo
                </span>
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                {tier.tagline}
              </p>
              <p className="mt-4 text-sm font-semibold">{tier.callAllowance}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="text-brand-via mt-0.5 size-4 shrink-0"
                      aria-hidden
                    />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="mt-8 w-full"
                variant={tier.featured ? "default" : "outline"}
              >
                <Link href="/signup">{tier.cta}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground mt-8 text-sm">
        Prices exclude VAT. Cancel inside your first month and we refund it — no
        contract, no notice period.
      </p>
    </section>
  );
}
