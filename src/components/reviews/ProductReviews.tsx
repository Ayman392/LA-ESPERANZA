"use client";

import { useState } from "react";
import { BadgeCheck, LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import type {
  PaginatedReviews,
  ProductReview,
  ReviewSummary,
} from "@/types/review";

type ProductReviewsProps = {
  productId: string;
  initialReviews: PaginatedReviews;
};

const inputClass =
  "mt-2 h-12 w-full rounded-card border border-border bg-background px-4 text-sm text-charcoal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

const formatReviewDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));

function ReviewSummaryPanel({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="rounded-card border border-border bg-surface-strong p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
        Review Summary
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-5">
        <p className="font-serif text-6xl font-semibold text-charcoal">
          {summary.averageRating.toFixed(1)}
        </p>
        <div className="pb-1">
          <ReviewStars
            value={summary.averageRating}
            size="lg"
            label="Average rating"
          />
          <p className="mt-2 text-sm text-muted">
            Based on {summary.totalReviews}{" "}
            {summary.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-card border border-border bg-surface-strong p-5 shadow-soft"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-charcoal">{review.customerName}</p>
          <p className="mt-1 text-xs text-muted">
            {formatReviewDate(review.createdAt)}
          </p>
        </div>
        <ReviewStars value={review.rating} size="sm" />
      </div>
      {review.verifiedPurchase ? (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/35 bg-[#C9A96A]/10 px-3 py-1 text-xs font-semibold text-[#7A5E2A]">
          <BadgeCheck aria-hidden className="h-4 w-4" />
          Verified Purchase
        </p>
      ) : null}
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">
        {review.reviewText}
      </p>
    </motion.article>
  );
}

export function ProductReviews({
  productId,
  initialReviews,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews.reviews);
  const [summary] = useState(initialReviews.summary);
  const [page, setPage] = useState(initialReviews.page);
  const [totalPages, setTotalPages] = useState(initialReviews.totalPages);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const submitReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!name.trim() || !rating || !reviewText.trim()) {
      setError("Name, rating, and review are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          customerEmail: email,
          rating,
          reviewText,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit review.");
      }

      setName("");
      setEmail("");
      setRating(0);
      setReviewText("");
      setMessage(payload.message ?? "Your review was submitted for approval.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to submit review.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadMore = async () => {
    if (isLoadingMore || page >= totalPages) {
      return;
    }

    setIsLoadingMore(true);
    setError("");

    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/products/${productId}/reviews?page=${nextPage}&pageSize=${initialReviews.pageSize}`,
      );
      const payload = (await response.json()) as PaginatedReviews & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load more reviews.");
      }

      setReviews((current) => [...current, ...payload.reviews]);
      setPage(payload.page);
      setTotalPages(payload.totalPages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load more reviews.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <section className="mt-16 border-t border-border pt-12 md:mt-20 md:pt-16">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <ReviewSummaryPanel summary={summary} />
          <form
            onSubmit={submitReview}
            className="rounded-card border border-border bg-surface-strong p-6 shadow-soft"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Write a Review
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-charcoal">
              Share your impression
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-charcoal">
                Name
                <input
                  className={inputClass}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                />
              </label>
              <label className="text-sm font-semibold text-charcoal">
                Email <span className="font-normal text-muted">(optional)</span>
                <input
                  type="email"
                  className={inputClass}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                />
              </label>
            </div>
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-charcoal">
                Rating
              </legend>
              <div className="mt-2">
                <ReviewStars
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  label="Your rating"
                />
              </div>
            </fieldset>
            <label className="mt-5 block text-sm font-semibold text-charcoal">
              Review
              <textarea
                className="mt-2 min-h-36 w-full resize-y rounded-card border border-border bg-background px-4 py-3 text-sm leading-6 text-charcoal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                maxLength={2000}
                required
              />
            </label>
            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                {error}
              </p>
            ) : null}
            {message ? (
              <p
                role="status"
                className="mt-4 rounded-card border border-[#C9A96A]/30 bg-[#C9A96A]/10 px-4 py-3 text-sm font-medium text-[#6F5425]"
              >
                {message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-luxury btn-campaign-gold mt-5 inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>

        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                Customer Reviews
              </p>
              <h2 className="mt-3 font-serif text-3xl font-semibold text-charcoal">
                Worn, remembered, reviewed.
              </h2>
            </div>
            <p className="text-sm text-muted">
              {summary.totalReviews} approved
            </p>
          </div>
          <div className="mt-6 space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            ) : (
              <div className="rounded-card border border-dashed border-border bg-surface-strong px-6 py-14 text-center">
                <p className="font-serif text-2xl font-semibold text-charcoal">
                  No reviews yet
                </p>
                <p className="mt-2 text-sm text-muted">
                  Be the first to share your impression.
                </p>
              </div>
            )}
          </div>
          {page < totalPages ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={isLoadingMore}
              className="btn-secondary-luxury mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-charcoal disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isLoadingMore ? (
                <LoaderCircle aria-hidden className="h-4 w-4 animate-spin" />
              ) : null}
              {isLoadingMore ? "Loading..." : "Load More Reviews"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
