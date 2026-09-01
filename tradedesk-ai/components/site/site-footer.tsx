import Link from "next/link";

import { Logo } from "@/components/site/logo";

const homeownerLinks = [
  { href: "/find/plumber/naas", label: "Plumbers in Naas" },
  { href: "/find/electrician/newbridge", label: "Electricians in Newbridge" },
  { href: "/find/handyman/celbridge", label: "Handymen in Celbridge" },
  { href: "/find", label: "Browse every trade" },
];

const tradeLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#compare", label: "Cost of a missed call" },
  { href: "/signup", label: "Create an account" },
];

export function SiteFooter() {
  return (
    <footer className="band-dark mt-auto">
      <div className="mx-auto grid w-full max-w-[86rem] gap-10 px-4 py-16 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="text-muted-foreground mt-4 max-w-sm text-sm">
            The AI front desk for Irish trades — and the marketplace where
            homeowners find them. Built in Ireland, for plumbers, electricians,
            handymen and everyone else who can&apos;t answer a phone with two
            hands full.
          </p>
        </div>

        <div>
          <h2 className="field-label">I need a tradesman</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {homeownerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-muted-foreground hover:text-foreground rounded transition-colors"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="field-label">I am a tradesman</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {tradeLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className="text-muted-foreground hover:text-foreground rounded transition-colors"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground typed mx-auto flex w-full max-w-[86rem] flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} TradeDesk AI. Registered in Ireland.
          </p>
          <p>Prices shown exclude VAT. Cancel any time in your first month.</p>
        </div>
      </div>
    </footer>
  );
}
