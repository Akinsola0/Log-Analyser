import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "display flex items-center gap-2 rounded-md text-lg tracking-tight",
        className,
      )}
    >
      <span
        aria-hidden
        className="from-brand-from via-brand-via to-brand-to flex size-7 items-center justify-center rounded-lg bg-linear-100 text-[0.7rem] font-black text-white"
      >
        TD
      </span>
      TradeDesk
      <span className="text-muted-foreground align-super text-[0.6rem]">®</span>
    </Link>
  );
}
