import Link from "next/link";
import { ArrowRight, MapPin, Search, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Same fallback-colour photo pattern as the hero and About page: renders the
 * file if it exists, otherwise a plain `bg-card` tile — which re-colours
 * itself automatically inside a `.band-dark` panel via the token cascade.
 */
function PhotoBlock({ src, className }: { src: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "bg-card border-border rounded-2xl border bg-cover bg-center",
        className,
      )}
      style={{ backgroundImage: `url(${src})` }}
    />
  );
}

function Panel({
  dark,
  eyebrow,
  title,
  body,
  cta,
  href,
  photo,
  variant,
}: {
  dark?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  photo: string;
  variant: "search" | "clipboard";
}) {
  const BadgeIcon = variant === "search" ? Search : Wrench;

  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-16 text-center sm:px-10 md:py-24",
        dark ? "band-dark" : "bg-secondary/60",
      )}
      // A warm charcoal-brown rather than .band-dark's default near-black
      // overlay — the same tone used as the hero photo's fallback colour,
      // so the page's one dark tone stays consistent rather than adding a
      // second one. An inline style wins outright, rather than depending on
      // Tailwind's utility-vs-component layer ordering to beat .band-dark's
      // own `background` rule.
      style={dark ? { backgroundColor: "#3a352f" } : undefined}
    >
      <p className="kicker">{eyebrow}</p>
      <h2 className="display mt-3 text-2xl sm:text-3xl">{title}</h2>
      <p className="text-muted-foreground mt-3 max-w-sm text-balance">{body}</p>
      <Button
        asChild
        size="lg"
        className="mt-6"
        variant={dark ? "invert" : "default"}
      >
        <Link href={href}>
          {cta}
          <ArrowRight />
        </Link>
      </Button>

      <div className="relative mt-10 w-full max-w-xs">
        <PhotoBlock src={photo} className="aspect-4/3 w-full" />
        <span className="bg-primary text-primary-foreground absolute -right-3 -top-3 flex size-11 items-center justify-center rounded-full shadow-sm sm:size-12">
          <BadgeIcon className="size-5" aria-hidden />
        </span>
        {variant === "search" ? (
          <span className="bg-card text-foreground absolute -bottom-3 -left-3 flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm">
            <MapPin className="text-primary size-3.5" aria-hidden />
            Near you
          </span>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The two-audience showcase, right under the hero: a homeowner panel
 * ("find a tradesman") and a business panel ("grow with TradeDesk AI"),
 * side by side so a visitor sorts themselves in one glance — same idea as
 * Booksy's consumer-app / BooksyBiz split. Each panel's photo is a
 * local-only file (see public/images/README.md), same convention as the
 * hero: a plain fallback tile renders until it's supplied.
 */
export function AudienceSplit() {
  return (
    <section aria-label="Two ways to use TradeDesk AI" className="border-b">
      <div className="grid md:grid-cols-2">
        <Panel
          eyebrow="For homeowners"
          title="Find a tradesman near you"
          body="Search verified plumbers, electricians and more, check real reviews, and book straight from their profile — no chasing voicemail."
          cta="Find a tradesman"
          href="/find"
          photo="/images/audience-homeowner.jpg"
          variant="search"
        />
        <Panel
          dark
          eyebrow="For trade businesses"
          title="TradeDesk AI for your business"
          body="Answer every call, keep your calendar full, and get found by homeowners searching in your area — all from one dashboard."
          cta="Grow my business"
          href="/signup"
          photo="/images/audience-business.jpg"
          variant="clipboard"
        />
      </div>
    </section>
  );
}
