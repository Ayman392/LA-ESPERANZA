import type {
  Product,
  ProductSizeLabel,
  ProductSizeMl,
  ProductVariant,
} from "@/types/product";

const DEFAULT_VARIANT_STOCK = 30;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

type ProductSeed = Omit<Product, "stock" | "variants">;

const getSizeLabel = (sizeMl: ProductSizeMl): ProductSizeLabel => `${sizeMl}ml`;

const createVariant = (
  productId: string,
  sizeMl: ProductSizeMl,
  price: number,
): ProductVariant => ({
  id: `${productId}-${sizeMl}ml`,
  productId,
  sizeMl,
  sizeLabel: getSizeLabel(sizeMl),
  price,
  stockQuantity: DEFAULT_VARIANT_STOCK,
  lowStockThreshold: DEFAULT_LOW_STOCK_THRESHOLD,
});

const createProduct = (product: ProductSeed): Product => {
  const variants = [
    createVariant(product.id, 15, product.size15mlPrice),
    createVariant(product.id, 30, product.size30mlPrice),
  ];

  return {
    ...product,
    variants,
    stock: variants.reduce((total, variant) => total + variant.stockQuantity, 0),
  };
};

// Central product catalog data mirrors the current size-level inventory model.
export const products: Product[] = [
  createProduct({
    id: "prd-velour",
    slug: "velour",
    name: "Velour",
    inspiredBy: "Yves Saint Laurent Libre",
    gender: "Women",
    size15mlPrice: 700,
    size30mlPrice: 1250,
    topNotes: ["Lavender", "Mandarin", "Blackcurrant"],
    middleNotes: ["Orange blossom", "Jasmine", "Neroli"],
    baseNotes: ["Vanilla", "Musk", "Cedar"],
    longevity: "7-9 hours",
    occasion: "Formal",
    description:
      "A sleek floral amber profile with aromatic lift, creamy warmth, and a dressed-up finish.",
    image: "/products/velour.png",
  }),
  createProduct({
    id: "prd-myst",
    slug: "myst",
    name: "Myst",
    inspiredBy: "Dior Sauvage",
    gender: "Men",
    size15mlPrice: 680,
    size30mlPrice: 1200,
    topNotes: ["Calabrian bergamot", "Pepper", "Grapefruit"],
    middleNotes: ["Lavender", "Geranium", "Elemi"],
    baseNotes: ["Ambroxan", "Cedar", "Patchouli"],
    longevity: "8-10 hours",
    occasion: "Daily",
    description:
      "A crisp aromatic scent with spicy freshness, clean woods, and confident everyday projection.",
    image: "/products/flame.png",
  }),
  createProduct({
    id: "prd-venyx",
    slug: "venyx",
    name: "Venyx",
    inspiredBy: "Creed Aventus",
    gender: "Men",
    size15mlPrice: 720,
    size30mlPrice: 1300,
    topNotes: ["Pineapple", "Bergamot", "Blackcurrant"],
    middleNotes: ["Birch", "Jasmine", "Patchouli"],
    baseNotes: ["Oakmoss", "Ambergris", "Musk"],
    longevity: "8-10 hours",
    occasion: "Signature",
    description:
      "A refined fruity-woody fragrance with polished smoke, bright citrus, and a memorable masculine trail.",
    image: "/products/sera.png",
  }),
  createProduct({
    id: "prd-poseidon",
    slug: "poseidon",
    name: "Poseidon",
    inspiredBy: "Acqua di Gio Profumo",
    gender: "Men",
    size15mlPrice: 680,
    size30mlPrice: 1200,
    topNotes: ["Sea notes", "Bergamot", "Grapefruit"],
    middleNotes: ["Sage", "Rosemary", "Geranium"],
    baseNotes: ["Incense", "Patchouli", "Mineral amber"],
    longevity: "7-9 hours",
    occasion: "Office",
    description:
      "A refined aquatic aromatic fragrance with mineral freshness and a smoky masculine base.",
    image: "/products/poseidon.png",
  }),
  createProduct({
    id: "prd-lume",
    slug: "lume",
    name: "Lume",
    inspiredBy: "Chanel Chance Eau Tendre",
    gender: "Women",
    size15mlPrice: 650,
    size30mlPrice: 1150,
    topNotes: ["Quince", "Grapefruit", "Mandarin"],
    middleNotes: ["Jasmine", "Hyacinth", "Rose"],
    baseNotes: ["White musk", "Amber", "Cedar"],
    longevity: "6-8 hours",
    occasion: "Daytime",
    description:
      "A luminous soft floral with airy fruit, delicate petals, and a graceful musky finish.",
    image: "/products/rosee.png",
  }),
  createProduct({
    id: "prd-zeus",
    slug: "zeus",
    name: "Zeus",
    inspiredBy: "Paco Rabanne Invictus",
    gender: "Men",
    size15mlPrice: 690,
    size30mlPrice: 1220,
    topNotes: ["Grapefruit", "Marine accord", "Mandarin"],
    middleNotes: ["Bay leaf", "Jasmine", "Spices"],
    baseNotes: ["Guaiac wood", "Ambergris", "Oakmoss"],
    longevity: "7-9 hours",
    occasion: "Evening",
    description:
      "A powerful fresh-woody scent with aquatic brightness, warm woods, and energetic performance.",
    image: "/products/flame.png",
  }),
];

export const productOccasions = Array.from(
  new Set(products.map((product) => product.occasion)),
).sort();

export const getProductBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);

export const getProductVariant = (
  product: Product,
  size: ProductSizeLabel,
) => product.variants.find((variant) => variant.sizeLabel === size);

export const getProductTotalStock = (product: Product) =>
  product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);
