import "server-only";

import { getSizeLabel, toProductSizeMl } from "@/lib/products";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Product, ProductGender, ProductVariant } from "@/types/product";

type CatalogVariantRow = {
  id: string;
  product_id: string;
  size_ml: number;
  price?: number | string | null;
  stock_quantity: number | string | null;
  low_stock_threshold: number | string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CatalogProductRow = {
  id: string;
  slug: string;
  name: string;
  inspired_by: string;
  gender: ProductGender;
  description: string | null;
  image: string | null;
  image_url: string | null;
  image_path: string | null;
  top_notes: string[] | string | null;
  middle_notes: string[] | string | null;
  base_notes: string[] | string | null;
  longevity: string | null;
  occasion: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  product_variants: CatalogVariantRow[] | null;
};

const catalogSelect =
  "id, slug, name, inspired_by, gender, description, image, image_url, image_path, top_notes, middle_notes, base_notes, longevity, occasion, is_active, created_at, updated_at, product_variants(id, product_id, size_ml, price, stock_quantity, low_stock_threshold, created_at, updated_at)";

const canReadSupabaseCatalog = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value ?? 0);

const toStringArray = (value: string[] | string | null | undefined) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const mapVariant = (variant: CatalogVariantRow): ProductVariant => {
  const sizeMl = toProductSizeMl(variant.size_ml);

  return {
    id: variant.id,
    productId: variant.product_id,
    sizeMl,
    sizeLabel: getSizeLabel(sizeMl),
    price: toNumber(variant.price),
    stockQuantity: toNumber(variant.stock_quantity),
    lowStockThreshold: toNumber(variant.low_stock_threshold ?? 5),
    createdAt: variant.created_at ?? undefined,
    updatedAt: variant.updated_at ?? undefined,
  };
};

const mapProduct = (product: CatalogProductRow): Product => {
  const variants = (product.product_variants ?? [])
    .map(mapVariant)
    .sort((first, second) => first.sizeMl - second.sizeMl);
  const image = product.image_url ?? product.image ?? "/products/flame.png";

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    inspiredBy: product.inspired_by,
    gender: product.gender,
    variants,
    product_variants: variants,
    topNotes: toStringArray(product.top_notes),
    middleNotes: toStringArray(product.middle_notes),
    baseNotes: toStringArray(product.base_notes),
    longevity: product.longevity ?? "6-8 hours",
    occasion: product.occasion ?? "Daily",
    description:
      product.description ??
      "A refined LA ESPERANZA inspired perfume with a polished everyday profile.",
    image,
    imageUrl: product.image_url ?? undefined,
    imagePath: product.image_path ?? undefined,
    isActive: product.is_active ?? true,
    createdAt: product.created_at ?? undefined,
    updatedAt: product.updated_at ?? undefined,
  };
};

export const getCatalogProducts = async (): Promise<Product[]> => {
  if (!canReadSupabaseCatalog()) {
    return [];
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(catalogSelect)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<CatalogProductRow[]>();

  if (error) {
    console.error("Unable to load Supabase catalog products:", error.message);

    return [];
  }

  return (data ?? []).map(mapProduct);
};

export const getCatalogProductBySlug = async (slug: string) => {
  if (!canReadSupabaseCatalog()) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(catalogSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<CatalogProductRow>();

  if (error) {
    console.error("Unable to load Supabase catalog product:", error.message);

    return null;
  }

  return data ? mapProduct(data) : null;
};
