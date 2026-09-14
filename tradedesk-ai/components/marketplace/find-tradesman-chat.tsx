"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";

import { ListingCard } from "@/components/marketplace/listing-card";
import { iconForCategory } from "@/components/marketplace/photo-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  recommendTradespeople,
  type MarketplaceCategory,
  type MarketplaceListing,
  type TradeType,
} from "@/lib/api";
import { tradeTypeLabels } from "@/lib/labels";

type Step = "issue" | "eircode" | "dates" | "confirm" | "loading" | "results";

const DATE_OPTIONS = [
  "As soon as possible",
  "This week",
  "Next 2 weeks",
  "I'm flexible",
];

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

/**
 * A guided, scripted conversation — not a real language model. It asks one
 * question at a time (issue, Eircode, date range), then scores this
 * category/location's listings via `recommendTradespeople()` and shows the
 * top 5. See docs/VISUAL_TOUR.md for why this is scripted rather than a live
 * AI call: the project has no backend/model wired up yet, and this reads as
 * a real assistant without pretending to understand free text it can't.
 */
export function FindTradesmanChat({
  category,
  location,
  town,
  categories,
}: {
  category: TradeType;
  location: string;
  town: string;
  categories: MarketplaceCategory[];
}) {
  const label = tradeTypeLabels[category].toLowerCase();

  function openingMessage(): ChatMessage {
    return {
      from: "bot",
      text: `Tell me what's going on and I'll match you with ${label}s in ${town} who fit the job.`,
    };
  }

  const [step, setStep] = useState<Step>("issue");
  const [messages, setMessages] = useState<ChatMessage[]>([openingMessage()]);
  const [issue, setIssue] = useState("");
  const [eircode, setEircode] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [draft, setDraft] = useState("");
  const [results, setResults] = useState<MarketplaceListing[] | null>(null);

  function pushBot(text: string) {
    setMessages((current) => [...current, { from: "bot", text }]);
  }

  function pushUser(text: string) {
    setMessages((current) => [...current, { from: "user", text }]);
  }

  function submitIssue() {
    const text = draft.trim();
    if (!text) return;
    setIssue(text);
    pushUser(text);
    setDraft("");
    pushBot("Got it. What's your Eircode (or just your townland/area)?");
    setStep("eircode");
  }

  function submitEircode() {
    const text = draft.trim();
    if (!text) return;
    setEircode(text);
    pushUser(text);
    setDraft("");
    pushBot("And when would suit you best?");
    setStep("dates");
  }

  function chooseDateRange(option: string) {
    setDateRange(option);
    pushUser(option);
    pushBot(
      `Looking for ${label}s near ${eircode || town} who can do that ${option.toLowerCase()}. Ready when you are.`,
    );
    setStep("confirm");
  }

  async function findMatches() {
    setStep("loading");
    const matches = await recommendTradespeople({
      category,
      location,
      issue_description: issue,
      eircode,
      date_range: dateRange,
    });
    setResults(matches);
    setStep("results");
  }

  function reset() {
    setStep("issue");
    setMessages([openingMessage()]);
    setIssue("");
    setEircode("");
    setDateRange("");
    setDraft("");
    setResults(null);
  }

  function submitDraft() {
    if (step === "issue") submitIssue();
    else if (step === "eircode") submitEircode();
  }

  const prefillSuffix = `?issue=${encodeURIComponent(issue)}&eircode=${encodeURIComponent(eircode)}&dates=${encodeURIComponent(dateRange)}`;

  return (
    <Card className="mb-6 gap-0 overflow-hidden py-0">
      <CardContent className="p-0">
        <div className="band-dark flex items-center gap-2.5 px-5 py-4">
          <span className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
            TD
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">TradeDesk AI</p>
            <p className="text-xs text-white/70">
              Finds the right {label} for the job
            </p>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex",
                message.from === "user" ? "justify-end" : "justify-start",
              )}
            >
              <p
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.from === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground",
                )}
              >
                {message.text}
              </p>
            </div>
          ))}

          {step === "loading" ? (
            <div className="flex justify-start">
              <p className="bg-secondary text-muted-foreground flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Matching you with {label}s in {town}…
              </p>
            </div>
          ) : null}

          {step === "results" && results ? (
            <div className="space-y-3 pt-1">
              <p className="text-muted-foreground text-sm">
                {results.length > 0
                  ? "Here's who I'd recommend, best fit first — pick one to send your details across."
                  : "Nobody matches exactly right now — try the full list below instead."}
              </p>
              {results.length > 0 ? (
                <ul className="space-y-3">
                  {results.map((listing) => (
                    <li key={listing.slug}>
                      <ListingCard
                        listing={listing}
                        icon={iconForCategory(listing.categories, categories)}
                        hrefSuffix={prefillSuffix}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
              <Button type="button" variant="outline" size="sm" onClick={reset}>
                Start over
              </Button>
            </div>
          ) : null}
        </div>

        {step === "issue" || step === "eircode" ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitDraft();
            }}
            className="border-t px-5 py-4"
          >
            <div className="flex gap-2">
              {step === "issue" ? (
                <Textarea
                  autoFocus
                  rows={2}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="e.g. Boiler's making a banging noise and the upstairs radiators are cold"
                  className="resize-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitDraft();
                    }
                  }}
                />
              ) : (
                <Input
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="e.g. W91 X2R0"
                />
              )}
              <Button
                type="submit"
                size="icon"
                className="shrink-0"
                disabled={!draft.trim()}
                aria-label="Send"
              >
                <ArrowRight />
              </Button>
            </div>
          </form>
        ) : null}

        {step === "dates" ? (
          <div className="flex flex-wrap gap-2 border-t px-5 py-4">
            {DATE_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => chooseDateRange(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : null}

        {step === "confirm" ? (
          <div className="border-t px-5 py-4">
            <Button type="button" onClick={findMatches}>
              <Sparkles />
              Find my {label}s
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
