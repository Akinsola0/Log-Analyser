import Link from "next/link";

import { RatingStars } from "@/components/rating-stars";
import { formatDate } from "@/lib/format";
import type { MarketplaceReview } from "@/lib/api";

type FeaturedReview = MarketplaceReview & {
  business_name: string;
  business_slug: string;
};

/**
 * Real review text, not a review count with nothing behind it: every review here
 * also renders on the profile it links to.
 *
 * Rendered as an inverted band — the long dark page needs the break.
 */
export function Reviews({ reviews }: { reviews: FeaturedReview[] }) {
  return (
    <section className="section-invert">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 md:py-24">
        <p className="kicker text-invert-muted-foreground">
          Reviews from real jobs
        </p>
        <h2 className="display mt-3 max-w-3xl text-4xl sm:text-5xl">
          What homeowners said last month
        </h2>
        <p className="text-invert-muted-foreground mt-4 max-w-2xl">
          Only a customer with a completed job can leave a review, and every one
          of them is published on the tradesman&apos;s profile.
        </p>

        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="border-invert-border flex flex-col gap-4 rounded-2xl border bg-white p-6"
            >
              <RatingStars rating={review.rating} size="sm" />
              <blockquote className="text-lg leading-snug font-medium text-balance">
                “{review.comment}”
              </blockquote>
              <div className="text-invert-muted-foreground mt-auto pt-2 text-xs">
                <span className="text-invert-foreground font-semibold">
                  {review.customer_name}
                </span>
                {review.job_service ? ` · ${review.job_service}` : ""} ·{" "}
                {formatDate(review.created_at)}
                <br />
                <Link
                  href={`/pro/${review.business_slug}`}
                  className="text-invert-foreground rounded font-medium underline underline-offset-4"
                >
                  {review.business_name}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
