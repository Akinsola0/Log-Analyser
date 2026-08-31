import { howItWorksSteps } from "@/lib/marketing";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20"
    >
      <p className="text-primary text-sm font-semibold tracking-wide uppercase">
        For tradespeople
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
        An AI front desk that knows what a zone valve is
      </h2>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        No apps for your customers to download, no new number, no receptionist
        to train. You divert your calls and get on with the job.
      </p>

      <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {howItWorksSteps.map((step, index) => (
          <li key={step.title} className="border-t pt-4">
            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-full text-sm font-semibold">
              {index + 1}
            </span>
            <h3 className="mt-3 font-medium">{step.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
