import { trustSignals } from "@/lib/marketing";

/**
 * The three trust signals in one row rather than scattered — the same block
 * repeats on every marketplace listing and profile.
 */
export function TrustStrip() {
  return (
    <section
      aria-label="Why TradeDesk AI can be trusted"
      className="bg-secondary/50 border-b"
    >
      <div className="mx-auto grid w-full max-w-[86rem] divide-y px-4 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
        {trustSignals.map((signal, index) => (
          <div
            key={signal.title}
            className="py-6 md:px-6 md:first:pl-0 md:last:pr-0"
          >
            <p className="typed text-muted-foreground text-xs">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="display mt-2 text-lg">{signal.title}</h3>
            <p className="text-muted-foreground mt-1.5 max-w-[46ch] text-sm">
              {signal.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
