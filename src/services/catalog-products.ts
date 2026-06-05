import "server-only";

import { products } from "@/lib/products";
import { createSupabaseServerClient } from "@/supabase/server";
import type { Product } from "@/types/product";

type CatalogImageRow = {
  slug: string;
  image: string | null;
  image_url: string | null;
  image_path: string | null;
  is_active: boolean | null;
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
      .select("slug, image, image_url, image_path, is_active")
      .in(
        "slug",
        products.map((product) => product.slug),
      )
      .returns<CatalogImageRow[]>();

    if (error) {
      return products;
    }

    const imageBySlug = new Map((data ?? []).map((row) => [row.slug, row]));

    return products.map((product) => {
      const imageRecord = imageBySlug.get(product.slug);

      if (!imageRecord || imageRecord.is_active === false) {
        return product;
      }

      const imageUrl = imageRecord.image_url ?? imageRecord.image ?? product.image;

      return {
        ...product,
        image: imageUrl,
        imageUrl,
        imagePath: imageRecord.image_path ?? undefined,
      };
    });
  } catch {
    return products;
  }
};

export const getCatalogProductBySlug = async (slug: string) =>
  (await getCatalogProducts()).find((product) => product.slug === slug);
