import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { trustSignals } from "@/lib/marketing";

/** Split auth screen: the form on the left, why-you're-here on the accent right. */
export function AuthLayout({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main id="main" className="grid flex-1 lg:grid-cols-2">
      <div className="relative flex flex-col justify-center px-4 py-14 sm:px-10">
        <div
          aria-hidden
          className="brand-glow pointer-events-none absolute -top-24 -left-24 h-80 w-80 opacity-30"
        />
        <div className="relative mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="display mt-10 text-4xl">{title}</h1>
          <p className="text-muted-foreground mt-3 text-sm">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="text-muted-foreground mt-6 text-sm">{footer}</p>
          <p className="text-muted-foreground mt-10 text-xs">
            <Link
              href="/"
              className="rounded underline-offset-4 hover:underline"
            >
              ← Back to tradedesk.ai
            </Link>
          </p>
        </div>
      </div>

      <aside className="from-brand-from via-brand-via to-brand-to relative hidden flex-col justify-center overflow-hidden bg-linear-140 px-12 py-14 lg:flex">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-0 opacity-25"
        />

        <blockquote className="display relative max-w-md text-3xl leading-[1.05] text-white">
          “I was losing two or three jobs a week to voicemail.”
        </blockquote>
        <p className="relative mt-5 max-w-md text-white/80">
          Now the phone gets answered while I&apos;m under a sink and the
          job&apos;s in the diary before I&apos;m back in the van.
        </p>
        <p className="kicker relative mt-4 text-white/70">
          Dermot Kelly · Kelly Plumbing &amp; Heating, Naas
        </p>

        <ul className="relative mt-14 max-w-md space-y-5">
          {trustSignals.map((signal) => (
            <li key={signal.title} className="border-t border-white/25 pt-4">
              <p className="kicker text-white">{signal.title}</p>
              <p className="mt-1.5 text-sm text-white/75">{signal.body}</p>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
