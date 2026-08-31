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
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20"
    >
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pricing, on the page, where it should be
        </h2>
        <p className="text-muted-foreground mt-2">
          One booked job a month covers Starter. Every plan includes a profile
          in the homeowner marketplace, and there is no setup fee.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <div
            key={tier.id}
            className={cn(
              "bg-card relative flex flex-col rounded-xl border p-6",
              tier.featured &&
                "border-primary ring-primary/20 shadow-md ring-2",
            )}
          >
            {tier.featured ? (
              <span className="bg-primary text-primary-foreground absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-medium">
                Most popular
              </span>
            ) : null}

            <h3 className="text-lg font-semibold">{tier.name}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{tier.tagline}</p>

            <p className="mt-5 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">
                {formatEuro(tier.priceCents)}
              </span>
              <span className="text-muted-foreground text-sm">/ month</span>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {tier.callAllowance}
            </p>

            <ul className="mt-5 space-y-2.5 text-sm">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              asChild
              className="mt-6 w-full"
              variant={tier.featured ? "default" : "outline"}
            >
              <Link href="/signup">{tier.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground mt-6 text-sm">
        Prices exclude VAT. Cancel inside your first month and we refund it — no
        contract, no notice period.
      </p>
    </section>
  );
}
