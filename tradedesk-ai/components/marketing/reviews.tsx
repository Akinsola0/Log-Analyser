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
 */
export function Reviews({ reviews }: { reviews: FeaturedReview[] }) {
  return (
    <section className="bg-secondary/60 border-y">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What homeowners said last month
        </h2>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Only a customer with a completed job can leave a review, and every one
          of them is published on the tradesman&apos;s profile.
        </p>

        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="bg-card flex flex-col gap-3 rounded-xl border p-5"
            >
              <RatingStars rating={review.rating} size="sm" />
              <blockquote className="text-sm leading-relaxed">
                “{review.comment}”
              </blockquote>
              <div className="text-muted-foreground mt-auto pt-2 text-xs">
                <span className="text-foreground font-medium">
                  {review.customer_name}
                </span>
                {review.job_service ? ` · ${review.job_service}` : ""} ·{" "}
                {formatDate(review.created_at)}
                <br />
                <Link
                  href={`/pro/${review.business_slug}`}
                  className="text-primary rounded underline-offset-4 hover:underline"
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
