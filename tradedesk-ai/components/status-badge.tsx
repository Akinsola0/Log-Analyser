/**
 * Badges for the status enums the backend owns.
 *
 * The colour maps are keyed by the enum values themselves, so a value the
 * backend adds without telling us still renders (as a neutral badge) instead of
 * crashing, and the compiler flags the missing colour.
 */
import {
  AlertTriangle,
  MessageSquare,
  Phone,
  PhoneOff,
  Store,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  CallOutcome,
  JobStatus,
  LeadSource,
  LeadStatus,
  LeadUrgency,
  MessageStatus,
} from "@/lib/api/types";
import {
  callOutcomeLabels,
  jobStatusLabels,
  leadSourceLabels,
  leadStatusLabels,
  leadUrgencyLabels,
  messageStatusLabels,
} from "@/lib/labels";

const base = "border font-medium";

const leadStatusStyles: Record<LeadStatus, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-700",
  qualified: "border-violet-200 bg-violet-50 text-violet-700",
  booked: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lost: "border-neutral-200 bg-neutral-100 text-neutral-600",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn(base, leadStatusStyles[status])}>
      {leadStatusLabels[status]}
    </Badge>
  );
}

const jobStatusStyles: Record<JobStatus, string> = {
  booked: "border-blue-200 bg-blue-50 text-blue-700",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-neutral-200 bg-neutral-100 text-neutral-600",
  cancelled: "border-red-200 bg-red-50 text-red-700",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={cn(base, jobStatusStyles[status])}>
      {jobStatusLabels[status]}
    </Badge>
  );
}

const callOutcomeStyles: Record<CallOutcome, string> = {
  booked: "border-emerald-200 bg-emerald-50 text-emerald-700",
  lead_only: "border-blue-200 bg-blue-50 text-blue-700",
  callback_required: "border-amber-300 bg-amber-50 text-amber-800",
  spam: "border-neutral-200 bg-neutral-100 text-neutral-600",
  failed: "border-red-200 bg-red-50 text-red-700",
};

export function CallOutcomeBadge({
  outcome,
  corrected = false,
}: {
  outcome: CallOutcome;
  /** True when an owner overrode the AI — the badge says so. */
  corrected?: boolean;
}) {
  return (
    <Badge variant="outline" className={cn(base, callOutcomeStyles[outcome])}>
      {outcome === "failed" ? <AlertTriangle aria-hidden /> : null}
      {callOutcomeLabels[outcome]}
      {corrected ? <span className="opacity-70">· corrected</span> : null}
    </Badge>
  );
}

const leadSourceStyles: Record<LeadSource, string> = {
  phone: "border-sky-200 bg-sky-50 text-sky-700",
  marketplace: "border-brand-amber/50 bg-amber-50 text-amber-800",
  manual: "border-neutral-200 bg-neutral-100 text-neutral-600",
};

const leadSourceIcons: Record<LeadSource, typeof Phone> = {
  phone: Phone,
  marketplace: Store,
  manual: UserPlus,
};

export function LeadSourceBadge({ source }: { source: LeadSource }) {
  const Icon = leadSourceIcons[source];
  return (
    <Badge variant="outline" className={cn(base, leadSourceStyles[source])}>
      <Icon aria-hidden />
      {leadSourceLabels[source]}
    </Badge>
  );
}

const urgencyStyles: Record<LeadUrgency, string> = {
  emergency: "border-red-200 bg-red-50 text-red-700",
  urgent: "border-amber-300 bg-amber-50 text-amber-800",
  routine: "border-neutral-200 bg-neutral-100 text-neutral-600",
};

export function UrgencyBadge({ urgency }: { urgency: LeadUrgency }) {
  return (
    <Badge variant="outline" className={cn(base, urgencyStyles[urgency])}>
      {leadUrgencyLabels[urgency]}
    </Badge>
  );
}

const messageStatusStyles: Record<MessageStatus, string> = {
  queued: "border-amber-300 bg-amber-50 text-amber-800",
  sent: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  failed: "border-red-200 bg-red-50 text-red-700",
};

export function MessageStatusBadge({ status }: { status: MessageStatus }) {
  return (
    <Badge variant="outline" className={cn(base, messageStatusStyles[status])}>
      {status === "failed" ? <PhoneOff aria-hidden /> : null}
      {status === "queued" ? <MessageSquare aria-hidden /> : null}
      {messageStatusLabels[status]}
    </Badge>
  );
}
