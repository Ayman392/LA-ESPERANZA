export type ReviewModerationStatus = "pending" | "approved" | "rejected";

export type ProductReview = {
  id: string;
  productId: string;
  userId?: string;
  customerName: string;
  rating: number;
  reviewText: string;
  verifiedPurchase: boolean;
  createdAt: string;
};

export type HomepageReview = Pick<
  ProductReview,
  | "id"
  | "customerName"
  | "rating"
  | "reviewText"
  | "verifiedPurchase"
  | "createdAt"
> & {
  productName?: string;
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
};

export type PaginatedReviews = {
  reviews: ProductReview[];
  summary: ReviewSummary;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateReviewInput = {
  productId: string;
  customerName: string;
  customerEmail?: string;
  rating: number;
  reviewText: string;
  userId?: string;
};
