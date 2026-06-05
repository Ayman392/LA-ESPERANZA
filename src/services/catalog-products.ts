import "server-only";

import { products } from "@/lib/products";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Product } from "@/types/product";

type CatalogImageRow = {
  id: string;
  slug: string;
  image: string | null;
  image_url: string | null;
  image_path: string | null;
  is_active: boolean | null;
  product_variants: Array<{
    id: string;
    size_ml: number;
    stock_quantity: number | null;
    low_stock_threshold: number | null;
  }> | null;
};

const canReadSupabaseCatalog = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

export const getCatalogProducts = async (): Promise<Product[]> => {
  if (!canReadSupabaseCatalog()) {
    return products;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select(
        "id, slug, image, image_url, image_path, is_active, product_variants(id, size_ml, stock_quantity, low_stock_threshold)",
      )
      .in(
        "slug",
        products.map((product) => product.slug),
      )
      .returns<CatalogImageRow[]>();

    if (error) {
      return products;
    }

    const inventoryBySlug = new Map((data ?? []).map((row) => [row.slug, row]));

    return products.map((product) => {
      const inventoryRecord = inventoryBySlug.get(product.slug);

      if (!inventoryRecord || inventoryRecord.is_active === false) {
        const variants = product.variants.map((variant) => ({
          ...variant,
          stockQuantity: 0,
        }));

        return {
          ...product,
          variants,
          stock: 0,
        };
      }

      const imageUrl =
        inventoryRecord.image_url ?? inventoryRecord.image ?? product.image;
      const variantStockBySize = new Map(
        (inventoryRecord.product_variants ?? []).map((variant) => [
          variant.size_ml,
          variant,
        ]),
      );
      const variants = product.variants.map((variant) => {
        const liveVariant = variantStockBySize.get(variant.sizeMl);

        return liveVariant
          ? {
              ...variant,
              id: liveVariant.id,
              stockQuantity: liveVariant.stock_quantity ?? 0,
              lowStockThreshold: liveVariant.low_stock_threshold ?? 5,
            }
          : {
              ...variant,
              stockQuantity: 0,
            };
      });

      return {
        ...product,
        variants,
        stock: variants.reduce(
          (total, variant) => total + variant.stockQuantity,
          0,
        ),
        image: imageUrl,
        imageUrl,
        imagePath: inventoryRecord.image_path ?? undefined,
      };
    });
  } catch {
    return products;
  }
};

export const getCatalogProductBySlug = async (slug: string) =>
  (await getCatalogProducts()).find((product) => product.slug === slug);
