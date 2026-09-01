import { howItWorksSteps } from "@/lib/marketing";

/**
 * Numbered because this genuinely is a sequence — the order is what the reader
 * needs. Set as docket line numbers rather than decorative markers.
 */
export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-8 md:py-24"
    >
      <div className="grid gap-10 lg:grid-cols-[26rem_1fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="field-label">For tradespeople</p>
          <h2 className="display mt-4 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)]">
            One call, start to finish
          </h2>
          <p className="text-muted-foreground mt-4 max-w-[46ch]">
            No app for your customers to download, no new number, no
            receptionist to train. You divert your calls and get on with the
            job.
          </p>
        </div>

        <ol className="divide-y border-t">
          {howItWorksSteps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-x-6 gap-y-2 py-7 sm:grid-cols-[4rem_1fr]"
            >
              <span className="typed text-muted-foreground text-sm">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="display text-xl">{step.title}</h3>
                <p className="text-muted-foreground mt-2 max-w-[62ch]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
