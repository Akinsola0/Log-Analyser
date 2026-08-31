import { BadgeCheck, ShieldCheck, Star } from "lucide-react";

import { trustSignals } from "@/lib/marketing";

const icons = [BadgeCheck, Star, ShieldCheck];

/**
 * The three trust signals in one block rather than scattered across the page —
 * the same block repeats on every marketplace listing and profile.
 */
export function TrustStrip() {
  return (
    <section
      aria-label="Why TradeDesk AI can be trusted"
      className="border-b bg-secondary/60"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        {trustSignals.map((signal, index) => {
          const Icon = icons[index] ?? BadgeCheck;
          return (
            <div key={signal.title} className="flex items-start gap-3">
              <span className="bg-background text-primary flex size-9 shrink-0 items-center justify-center rounded-md border">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold">{signal.title}</h3>
                <p className="text-muted-foreground mt-0.5 text-sm">
                  {signal.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
