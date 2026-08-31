import Link from "next/link";

import { Logo } from "@/components/site/logo";
import { trustSignals } from "@/lib/marketing";

/** Split auth screen: the form on the left, why-you're-here on the navy right. */
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
      <div className="flex flex-col justify-center px-4 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <p className="text-muted-foreground mt-6 text-sm">{footer}</p>
          <p className="text-muted-foreground mt-8 text-xs">
            <Link
              href="/"
              className="rounded underline-offset-4 hover:underline"
            >
              ← Back to tradedesk.ai
            </Link>
          </p>
        </div>
      </div>

      <aside className="bg-brand-navy text-brand-navy-foreground hidden flex-col justify-center px-10 py-12 lg:flex">
        <blockquote className="max-w-md text-xl leading-relaxed font-medium">
          “I was losing two or three jobs a week to voicemail. Now the phone
          gets answered while I&apos;m under a sink and the job&apos;s in the
          diary before I&apos;m back in the van.”
        </blockquote>
        <p className="mt-4 text-sm text-white/70">
          Dermot Kelly · Kelly Plumbing &amp; Heating, Naas
        </p>

        <ul className="mt-10 max-w-md space-y-4">
          {trustSignals.map((signal) => (
            <li key={signal.title}>
              <p className="text-sm font-semibold">{signal.title}</p>
              <p className="text-sm text-white/70">{signal.body}</p>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
