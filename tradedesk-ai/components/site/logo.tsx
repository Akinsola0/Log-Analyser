import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  /** `light` for use on the navy footer/hero. */
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-md text-base font-semibold tracking-tight",
        tone === "light" ? "text-white" : "text-foreground",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-7 items-center justify-center rounded-md text-sm font-bold",
          tone === "light"
            ? "bg-brand-amber text-brand-amber-foreground"
            : "bg-primary text-primary-foreground",
        )}
      >
        TD
      </span>
      TradeDesk AI
    </Link>
  );
}
