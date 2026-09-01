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
  new: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  qualified: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  booked: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  lost: "border-white/12 bg-white/5 text-white/55",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn(base, leadStatusStyles[status])}>
      {leadStatusLabels[status]}
    </Badge>
  );
}

const jobStatusStyles: Record<JobStatus, string> = {
  booked: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  confirmed: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  completed: "border-white/12 bg-white/5 text-white/55",
  cancelled: "border-red-400/35 bg-red-400/10 text-red-200",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={cn(base, jobStatusStyles[status])}>
      {jobStatusLabels[status]}
    </Badge>
  );
}

const callOutcomeStyles: Record<CallOutcome, string> = {
  booked: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  lead_only: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  callback_required: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  spam: "border-white/12 bg-white/5 text-white/55",
  failed: "border-red-400/35 bg-red-400/10 text-red-200",
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
  phone: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  // Marketplace leads wear the brand accent — they came from our own funnel.
  marketplace: "border-brand-to/45 bg-brand-to/12 text-pink-200",
  manual: "border-white/12 bg-white/5 text-white/55",
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
  emergency: "border-red-400/40 bg-red-400/12 text-red-200",
  urgent: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  routine: "border-white/12 bg-white/5 text-white/55",
};

export function UrgencyBadge({ urgency }: { urgency: LeadUrgency }) {
  return (
    <Badge variant="outline" className={cn(base, urgencyStyles[urgency])}>
      {leadUrgencyLabels[urgency]}
    </Badge>
  );
}

const messageStatusStyles: Record<MessageStatus, string> = {
  queued: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  sent: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  delivered: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  failed: "border-red-400/35 bg-red-400/10 text-red-200",
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
