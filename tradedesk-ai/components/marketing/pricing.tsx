import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/format";
import { pricingTiers } from "@/lib/marketing";
import { cn } from "@/lib/utils";

/**
 * Pricing is on the homepage, in numbers, with no "book a demo" in front of it
 * — the one thing every competitor we looked at hides.
 */
export function Pricing() {
  return (
    <section id="pricing" className="border-t">
      <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-8 md:py-24">
        <div className="max-w-3xl">
          <p className="field-label">Pricing</p>
          <h2 className="display mt-4 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)]">
            On the page, where it should be
          </h2>
          <p className="text-muted-foreground mt-4">
            One booked job a month covers Starter. Every plan includes a profile
            in the homeowner marketplace, and there is no setup fee.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                "docket relative flex flex-col px-6 pt-8 pb-7",
                tier.featured && "ring-primary ring-2",
              )}
            >
              {tier.featured ? (
                <span className="stamp border-primary text-primary absolute -top-3 right-5 bg-card">
                  Most taken
                </span>
              ) : null}

              <p className="field-label">{tier.name}</p>
              <p className="typed mt-3 text-5xl font-bold">
                {formatEuro(tier.priceCents)}
                <span className="text-muted-foreground text-base font-normal">
                  /mo
                </span>
              </p>
              <p className="text-muted-foreground mt-3 text-sm">
                {tier.tagline}
              </p>
              <p className="mt-5 border-t pt-5 font-semibold">
                {tier.callAllowance}
              </p>

              <ul className="mt-5 space-y-3 text-sm">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      className="text-primary mt-0.5 size-4 shrink-0"
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
          ))}
        </div>

        <p className="text-muted-foreground mt-8 text-sm">
          Prices exclude VAT. Cancel inside your first month and we refund it —
          no contract, no notice period.
        </p>
      </div>
    </section>
  );
}
