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
      className="border-y border-white/10 bg-white/[0.02]"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-8 md:grid-cols-3">
        {trustSignals.map((signal, index) => {
          const Icon = icons[index] ?? BadgeCheck;
          return (
            <div key={signal.title} className="flex items-start gap-3">
              <Icon
                className="text-brand-via mt-0.5 size-5 shrink-0"
                aria-hidden
              />
              <div>
                <h3 className="kicker">{signal.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm">
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
