import { howItWorksSteps } from "@/lib/marketing";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 md:py-24"
    >
      <p className="kicker text-gradient">For tradespeople</p>
      <h2 className="display mt-3 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">
        An AI front desk that knows what a zone valve is
      </h2>
      <p className="text-muted-foreground mt-4 max-w-2xl">
        No apps for your customers to download, no new number, no receptionist
        to train. You divert your calls and get on with the job.
      </p>

      <ol className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {howItWorksSteps.map((step, index) => (
          <li key={step.title} className="relative">
            <div className="from-brand-from via-brand-via to-brand-to h-px w-full bg-linear-100 opacity-60" />
            <span className="display text-muted-foreground/50 mt-5 block text-5xl">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
