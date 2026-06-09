import "server-only";

import { createSupabaseServerClient } from "@/supabase/server";
import type {
  AdminReview,
  AdminReviewStatistics,
} from "@/types/admin";
import type {
  CreateReviewInput,
  PaginatedReviews,
  ProductReview,
  ReviewModerationStatus,
  ReviewSummary,
} from "@/types/review";

type ReviewRow = {
  id: string;
  product_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  review_text: string;
  verified_purchase: boolean;
  is_approved: boolean;
  moderation_status: ReviewModerationStatus;
  created_at: string;
  updated_at: string;
  products?: { name: string } | null;
};

type ReviewSummaryRow = {
  average_rating: number | string | null;
  total_reviews: number | string | null;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const defaultPageSize = 5;
const missingReviewSchemaCodes = new Set(["PGRST202", "PGRST205"]);

const isReviewSchemaUnavailable = (code?: string) =>
  Boolean(code && missingReviewSchemaCodes.has(code));

const toProductReview = (review: ReviewRow): ProductReview => ({
  id: review.id,
  productId: review.product_id,
  userId: review.user_id ?? undefined,
  customerName: review.customer_name,
  rating: Number(review.rating),
  reviewText: review.review_text,
  verifiedPurchase: review.verified_purchase,
  createdAt: review.created_at,
});

export const getProductReviewSummary = async (
  productId: string,
): Promise<ReviewSummary> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "get_product_review_summary",
    { p_product_id: productId },
  );

  if (error) {
    if (isReviewSchemaUnavailable(error.code)) {
      return { averageRating: 0, totalReviews: 0 };
    }

    throw new Error(error.message);
  }

  const summary = (data as unknown as ReviewSummaryRow[] | null)?.[0];

  return {
    averageRating: Number(summary?.average_rating ?? 0),
    totalReviews: Number(summary?.total_reviews ?? 0),
  };
};

export const getApprovedProductReviews = async (
  productId: string,
  page = 1,
  pageSize = defaultPageSize,
): Promise<PaginatedReviews> => {
  const safePage = Math.max(1, Math.trunc(page));
  const safePageSize = Math.min(20, Math.max(1, Math.trunc(pageSize)));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  const supabase = createSupabaseServerClient();
  const [reviewsResult, summary] = await Promise.all([
    supabase
      .from("reviews")
      .select(
        "id, product_id, user_id, customer_name, customer_email, rating, review_text, verified_purchase, is_approved, moderation_status, created_at, updated_at",
        { count: "exact" },
      )
      .eq("product_id", productId)
      .eq("is_approved", true)
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to)
      .returns<ReviewRow[]>(),
    getProductReviewSummary(productId),
  ]);

  if (reviewsResult.error) {
    if (isReviewSchemaUnavailable(reviewsResult.error.code)) {
      return {
        reviews: [],
        summary: { averageRating: 0, totalReviews: 0 },
        page: safePage,
        pageSize: safePageSize,
        totalPages: 1,
      };
    }

    throw new Error(reviewsResult.error.message);
  }

  const totalReviews = reviewsResult.count ?? summary.totalReviews;

  return {
    reviews: (reviewsResult.data ?? []).map(toProductReview),
    summary: {
      ...summary,
      totalReviews,
    },
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(totalReviews / safePageSize)),
  };
};

const isVerifiedPurchase = async (
  customerEmail: string | undefined,
  productId: string,
) => {
  if (!customerEmail) {
    return false;
  }

  const supabase = createSupabaseServerClient();
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .ilike("customer_email", customerEmail)
    .eq("status", "delivered")
    .returns<Array<{ id: string }>>();

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const orderIds = (orders ?? []).map((order) => order.id);

  if (orderIds.length === 0) {
    return false;
  }

  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id")
    .in("order_id", orderIds)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (itemError) {
    throw new Error(itemError.message);
  }

  return Boolean(item);
};

export const createProductReview = async (input: CreateReviewInput) => {
  const customerName = input.customerName.trim();
  const customerEmail = input.customerEmail?.trim().toLowerCase() || undefined;
  const reviewText = input.reviewText.trim();
  const rating = Math.trunc(input.rating);

  if (!customerName) {
    throw new Error("Name is required.");
  }

  if (customerName.length > 100) {
    throw new Error("Name must be 100 characters or fewer.");
  }

  if (customerEmail && !emailPattern.test(customerEmail)) {
    throw new Error("Enter a valid email address.");
  }

  if (rating < 1 || rating > 5) {
    throw new Error("Choose a rating between 1 and 5 stars.");
  }

  if (!reviewText) {
    throw new Error("Review is required.");
  }

  if (reviewText.length > 2000) {
    throw new Error("Review must be 2,000 characters or fewer.");
  }

  const supabase = createSupabaseServerClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("id", input.productId)
    .eq("is_active", true)
    .maybeSingle<{ id: string }>();

  if (productError) {
    throw new Error(productError.message);
  }

  if (!product) {
    throw new Error("Product not found.");
  }

  const verifiedPurchase = await isVerifiedPurchase(
    customerEmail,
    input.productId,
  );
  const { error } = await supabase.from("reviews").insert({
    product_id: input.productId,
    user_id: input.userId ?? null,
    customer_name: customerName,
    customer_email: customerEmail ?? null,
    rating,
    review_text: reviewText,
    verified_purchase: verifiedPurchase,
    is_approved: false,
    moderation_status: "pending",
  });

  if (error) {
    throw new Error(error.message);
  }

  return { verifiedPurchase };
};

export const getAdminReviews = async (
  limit = 100,
): Promise<AdminReview[]> => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, product_id, user_id, customer_name, customer_email, rating, review_text, verified_purchase, is_approved, moderation_status, created_at, updated_at, products(name)",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(200, Math.max(1, limit)))
    .returns<ReviewRow[]>();

  if (error) {
    if (isReviewSchemaUnavailable(error.code)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((review) => ({
    id: review.id,
    productId: review.product_id,
    productName: review.products?.name ?? "Unknown product",
    customerName: review.customer_name,
    customerEmail: review.customer_email ?? undefined,
    rating: Number(review.rating),
    reviewText: review.review_text,
    verifiedPurchase: review.verified_purchase,
    isApproved: review.is_approved,
    moderationStatus: review.moderation_status,
    createdAt: review.created_at,
  }));
};

export const getAdminReviewStatistics =
  async (): Promise<AdminReviewStatistics> => {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("rating, is_approved, moderation_status")
      .returns<
        Array<{
          rating: number;
          is_approved: boolean;
          moderation_status: ReviewModerationStatus;
        }>
      >();

    if (error) {
      if (isReviewSchemaUnavailable(error.code)) {
        return {
          totalReviews: 0,
          averageRating: 0,
          pendingReviews: 0,
          approvedReviews: 0,
        };
      }

      throw new Error(error.message);
    }

    const reviews = data ?? [];
    const approved = reviews.filter(
      (review) =>
        review.is_approved && review.moderation_status === "approved",
    );

    return {
      totalReviews: reviews.length,
      averageRating:
        approved.length > 0
          ? approved.reduce(
              (total, review) => total + Number(review.rating),
              0,
            ) / approved.length
          : 0,
      pendingReviews: reviews.filter(
        (review) => review.moderation_status === "pending",
      ).length,
      approvedReviews: approved.length,
    };
  };

export const moderateReview = async (
  reviewId: string,
  status: Exclude<ReviewModerationStatus, "pending">,
) => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("reviews")
    .update({
      moderation_status: status,
      is_approved: status === "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select(
      "id, product_id, user_id, customer_name, customer_email, rating, review_text, verified_purchase, is_approved, moderation_status, created_at, updated_at",
    )
    .single<ReviewRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteReview = async (reviewId: string) => {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("reviews").delete().eq("id", reviewId);

  if (error) {
    throw new Error(error.message);
  }
};
