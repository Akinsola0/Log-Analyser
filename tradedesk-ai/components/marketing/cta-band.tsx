import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="bg-brand-navy text-brand-navy-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Stop losing jobs to voicemail
          </h2>
          <p className="mt-2 max-w-xl text-white/75">
            Set it up in ten minutes: divert your number, set your working
            hours, and let it answer the next call.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="amber" size="lg">
            <Link href="/signup">
              Start free for 14 days
              <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="/find">Looking for a tradesman?</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
