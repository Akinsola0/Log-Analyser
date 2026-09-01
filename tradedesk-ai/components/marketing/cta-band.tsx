import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="px-4 pb-16 sm:px-8 md:pb-24">
      <div className="from-brand-from via-brand-via to-brand-to relative mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] bg-linear-120 px-6 py-16 sm:px-12 md:py-20">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-25"
        />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker text-white/70">Ten minutes to set up</p>
            <h2 className="display mt-3 max-w-2xl text-4xl text-white sm:text-6xl">
              Stop losing jobs to voicemail
            </h2>
            <p className="mt-4 max-w-xl text-white/80">
              Divert your number, set your working hours, and let it answer the
              next call.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="invert" size="lg">
              <Link href="/signup">
                Start free for 14 days
                <ArrowRight />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/find">Looking for a tradesman?</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
