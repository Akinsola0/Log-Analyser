import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "display flex items-baseline gap-2 rounded text-xl",
        className,
      )}
    >
      TradeDesk
      <span className="typed text-muted-foreground text-[0.7rem] font-normal tracking-normal normal-case">
        AI
      </span>
    </Link>
  );
}
