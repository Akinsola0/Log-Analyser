import { Check, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEuro } from "@/lib/format";
import {
  MISSED_CALL_MATHS,
  comparisonRows,
  missedCallCostPerMonthCents,
} from "@/lib/marketing";

/**
 * The cost of a missed call, a receptionist, and us — with the arithmetic
 * shown rather than asserted. On the dark band the accent is hi-vis: biro only
 * reaches 1.6:1 here.
 */
export function CostComparison() {
  return (
    <section id="compare" className="band-dark">
      <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-8 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[24rem_1fr] lg:items-start">
          <div>
            <p className="field-label">The maths</p>
            <h2 className="display mt-4 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)]">
              What a missed call really costs
            </h2>

            <p className="typed mt-8 text-[clamp(3rem,2rem+4vw,4.5rem)] leading-none font-bold">
              <span className="marker">
                {formatEuro(missedCallCostPerMonthCents)}
              </span>
            </p>
            <p className="text-muted-foreground mt-4 max-w-[42ch] text-sm">
              {MISSED_CALL_MATHS.missedCallsPerWeek} missed calls a week, at an
              average call-out of{" "}
              {formatEuro(MISSED_CALL_MATHS.averageJobValueCents)}, is that much
              a month going to whoever picks up next. A receptionist fixes it
              for about €2,000 a month. We fix it for €99.
            </p>
          </div>

          <div className="overflow-hidden border">
            <Table className="min-w-[44rem]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[28%]">&nbsp;</TableHead>
                  <TableHead className="w-[24%]">Missing the call</TableHead>
                  <TableHead className="w-[24%]">A receptionist</TableHead>
                  <TableHead className="text-foreground w-[24%] bg-white/5">
                    TradeDesk AI
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-muted-foreground font-semibold">
                      {row.label}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <X className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {row.missedCalls}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.receptionist}
                    </TableCell>
                    <TableCell className="bg-white/5 font-medium">
                      <span className="flex items-start gap-2">
                        {row.tradedeskWins ? (
                          <Check
                            className="text-hivis mt-0.5 size-4 shrink-0"
                            aria-hidden
                          />
                        ) : null}
                        {row.tradedesk}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <p className="text-muted-foreground mt-6 max-w-[80ch] text-xs">
          Receptionist figure is a full-time salary plus employer PRSI at Irish
          market rates. Missed-call figure uses the average call-out value our
          trades report — change the assumption and the sum changes, but the
          direction doesn&apos;t.
        </p>
      </div>
    </section>
  );
}
