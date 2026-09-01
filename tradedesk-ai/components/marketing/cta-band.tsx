import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="band-dark">
      <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-10 px-4 py-16 sm:px-8 md:flex-row md:items-end md:justify-between md:py-20">
        <div>
          <p className="field-label">Ten minutes to set up</p>
          <h2 className="display mt-4 max-w-2xl text-[clamp(2rem,1.4rem+3vw,4rem)]">
            The next call gets answered
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl">
            Divert your number, set your working hours, and let it pick up. The
            first docket lands in your dashboard the same day.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="hivis" size="lg">
            <Link href="/signup">
              Start free for 14 days
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/find">Looking for a tradesman?</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
