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

export const getProductVariant = (
  product: Product,
  size: ProductSizeLabel,
  variantId?: string,
) =>
  product.variants.find((variant) => variant.id === variantId) ??
  product.variants.find((variant) => variant.sizeLabel === size);

export const getProductTotalStock = (product: Product) =>
  product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);

const getVariantPrices = (product: Pick<Product, "variants">) =>
  product.variants.map((variant) => variant.price);

export const getProductMinPrice = (product: Pick<Product, "variants">) => {
  const prices = getVariantPrices(product);

  return prices.length ? Math.min(...prices) : 0;
};

export const getProductMaxPrice = (product: Pick<Product, "variants">) => {
  const prices = getVariantPrices(product);

  return prices.length ? Math.max(...prices) : 0;
};

export const getProductImageSrc = (
  product: Pick<Product, "image" | "imageUrl">,
) => product.imageUrl || product.image;

export const getProductOccasions = (products: Product[]) =>
  Array.from(new Set(products.map((product) => product.occasion))).sort();

export const sortProductVariants = <Variant extends Pick<ProductVariant, "sizeMl">>(
  variants: Variant[],
) => [...variants].sort((first, second) => first.sizeMl - second.sizeMl);
