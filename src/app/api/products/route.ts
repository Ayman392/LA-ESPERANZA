import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/services/catalog-products";

export async function GET() {
  const products = await getCatalogProducts();

  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}
