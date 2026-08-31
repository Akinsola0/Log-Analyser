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
 * The cost of a missed call, a receptionist, and us — side by side, with the
 * arithmetic shown rather than asserted.
 */
export function CostComparison() {
  return (
    <section id="compare" className="bg-secondary/60 border-y">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What a missed call really costs
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {MISSED_CALL_MATHS.missedCallsPerWeek} missed calls a week, at an
          average call-out of{" "}
          {formatEuro(MISSED_CALL_MATHS.averageJobValueCents)}, is{" "}
          <strong className="text-foreground">
            {formatEuro(missedCallCostPerMonthCents)} a month
          </strong>{" "}
          of work that goes to whoever picks up next. A receptionist fixes it
          for about €2,000 a month. We fix it for €99.
        </p>

        <div className="bg-card mt-8 overflow-hidden rounded-xl border">
          <Table className="min-w-[42rem]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[28%]">&nbsp;</TableHead>
                <TableHead className="w-[24%]">Missing the call</TableHead>
                <TableHead className="w-[24%]">A receptionist</TableHead>
                <TableHead className="bg-primary/5 text-primary w-[24%]">
                  TradeDesk AI
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-muted-foreground font-medium">
                    {row.label}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="flex items-start gap-2">
                      <X
                        className="mt-0.5 size-4 shrink-0 text-red-500"
                        aria-hidden
                      />
                      {row.missedCalls}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.receptionist}
                  </TableCell>
                  <TableCell className="bg-primary/5 font-medium">
                    <span className="flex items-start gap-2">
                      {row.tradedeskWins ? (
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-emerald-600"
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

        <p className="text-muted-foreground mt-4 text-xs">
          Receptionist figure is a full-time salary plus employer PRSI at Irish
          market rates. Missed-call figure uses the average call-out value our
          trades report — change the assumption and the sum changes, but the
          direction doesn&apos;t.
        </p>
      </div>
    </section>
  );
}
