import Link from "next/link";

import { RatingStars } from "@/components/rating-stars";
import { formatDate } from "@/lib/format";
import type { MarketplaceReview } from "@/lib/api";

type FeaturedReview = MarketplaceReview & {
  business_name: string;
  business_slug: string;
};

/**
 * Real review text, not a review count with nothing behind it: every review
 * here also renders on the profile it links to.
 */
export function Reviews({ reviews }: { reviews: FeaturedReview[] }) {
  return (
    <section className="band-dark">
      <div className="mx-auto w-full max-w-[86rem] px-4 py-16 sm:px-8 md:py-24">
        <p className="field-label">Reviews from completed jobs</p>
        <h2 className="display mt-4 max-w-3xl text-[clamp(2rem,1.4rem+2.4vw,3.25rem)]">
          What homeowners said last month
        </h2>
        <p className="text-muted-foreground mt-4 max-w-[58ch]">
          Only a customer with a completed job can leave a review, and every one
          of them is published on the tradesman&apos;s profile.
        </p>

        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id} className="flex flex-col border-t pt-6">
              <RatingStars rating={review.rating} size="sm" />
              <blockquote className="mt-4 text-xl leading-snug text-balance">
                “{review.comment}”
              </blockquote>
              <div className="text-muted-foreground mt-auto pt-6 text-sm">
                <span className="text-foreground font-semibold">
                  {review.customer_name}
                </span>
                {review.job_service ? ` · ${review.job_service}` : ""}
                <br />
                <span className="typed text-xs">
                  {formatDate(review.created_at)} ·{" "}
                  <Link
                    href={`/pro/${review.business_slug}`}
                    className="rounded underline underline-offset-4 hover:no-underline"
                  >
                    {review.business_name}
                  </Link>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
