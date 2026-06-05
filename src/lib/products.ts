import type {
  Product,
  ProductSizeLabel,
  ProductSizeMl,
  ProductVariant,
} from "@/types/product";

export const productSizeOptions: ProductSizeMl[] = [15, 30];

export const getSizeLabel = (sizeMl: ProductSizeMl): ProductSizeLabel =>
  `${sizeMl}ml`;

export const toProductSizeMl = (sizeMl: number): ProductSizeMl =>
  sizeMl === 30 ? 30 : 15;

type ProductVariantSource = {
  variants?: ProductVariant[] | null;
  product_variants?: ProductVariant[] | null;
};

export const getProductVariants = (product: ProductVariantSource) =>
  product.product_variants ?? product.variants ?? [];

export const getProductVariant = (
  product: Product,
  size: ProductSizeLabel,
  variantId?: string,
) =>
  getProductVariants(product).find((variant) => variant.id === variantId) ??
  getProductVariants(product).find((variant) => variant.sizeLabel === size);

export const getProductTotalStock = (product: Product) =>
  getProductVariants(product).reduce(
    (total, variant) => total + variant.stockQuantity,
    0,
  );

const getVariantPrices = (product: ProductVariantSource) => {
  const variants = getProductVariants(product);

  return variants.map((variant) => variant.price);
};

export const getProductMinPrice = (product: ProductVariantSource) => {
  const prices = getVariantPrices(product);

  return prices.length ? Math.min(...prices) : 0;
};

export const getProductMaxPrice = (product: ProductVariantSource) => {
  const prices = getVariantPrices(product);

  return prices.length ? Math.max(...prices) : 0;
};

export const getProductImageSrc = (
  product: Pick<Product, "image" | "imageUrl">,
) => product.imageUrl || product.image;

export const getProductOccasions = (products: Product[]) =>
  Array.from(new Set(products.map((product) => product.occasion))).sort();

export const sortProductVariants = <Variant extends Pick<ProductVariant, "sizeMl">>(
  variants: Variant[] | null | undefined,
) => [...(variants ?? [])].sort((first, second) => first.sizeMl - second.sizeMl);
