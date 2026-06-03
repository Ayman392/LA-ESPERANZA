import type { Product } from "@/types/product";

// Central product catalog data. Phase 2 keeps this local and typed until a backend is introduced.
export const products: Product[] = [
  {
    id: "prd-flame",
    slug: "flame",
    name: "Flame",
    inspiredBy: "Versace Eros",
    gender: "Men",
    size15mlPrice: 650,
    size30mlPrice: 1150,
    stock: 24,
    topNotes: ["Mint", "Green apple", "Lemon"],
    middleNotes: ["Tonka bean", "Ambroxan", "Geranium"],
    baseNotes: ["Vanilla", "Cedarwood", "Vetiver"],
    longevity: "8-10 hours",
    occasion: "Evening",
    description:
      "A bold, magnetic scent with crisp freshness, warm sweetness, and confident depth for evening wear.",
    image: "/products/flame.png",
  },
  {
    id: "prd-rosee",
    slug: "rosee",
    name: "Rosee",
    inspiredBy: "Miss Dior",
    gender: "Women",
    size15mlPrice: 620,
    size30mlPrice: 1100,
    stock: 31,
    topNotes: ["Mandarin", "Bergamot", "Pink pepper"],
    middleNotes: ["Rose", "Peony", "Jasmine"],
    baseNotes: ["White musk", "Patchouli", "Amberwood"],
    longevity: "6-8 hours",
    occasion: "Daily",
    description:
      "A soft floral signature with polished citrus brightness and a graceful musky finish.",
    image: "/products/rosee.png",
  },
  {
    id: "prd-velour",
    slug: "velour",
    name: "Velour",
    inspiredBy: "Yves Saint Laurent Libre",
    gender: "Women",
    size15mlPrice: 700,
    size30mlPrice: 1250,
    stock: 18,
    topNotes: ["Lavender", "Mandarin", "Blackcurrant"],
    middleNotes: ["Orange blossom", "Jasmine", "Neroli"],
    baseNotes: ["Vanilla", "Musk", "Cedar"],
    longevity: "7-9 hours",
    occasion: "Formal",
    description:
      "A sleek floral amber profile with aromatic lift, creamy warmth, and a dressed-up finish.",
    image: "/products/velour.png",
  },
  {
    id: "prd-poseidon",
    slug: "poseidon",
    name: "Poseidon",
    inspiredBy: "Acqua di Gio Profumo",
    gender: "Men",
    size15mlPrice: 680,
    size30mlPrice: 1200,
    stock: 27,
    topNotes: ["Sea notes", "Bergamot", "Grapefruit"],
    middleNotes: ["Sage", "Rosemary", "Geranium"],
    baseNotes: ["Incense", "Patchouli", "Mineral amber"],
    longevity: "7-9 hours",
    occasion: "Office",
    description:
      "A refined aquatic aromatic fragrance with mineral freshness and a smoky masculine base.",
    image: "/products/poseidon.png",
  },
  {
    id: "prd-sera",
    slug: "sera",
    name: "Sera",
    inspiredBy: "Maison Francis Kurkdjian Baccarat Rouge 540",
    gender: "Unisex",
    size15mlPrice: 780,
    size30mlPrice: 1400,
    stock: 15,
    topNotes: ["Saffron", "Jasmine", "Orange zest"],
    middleNotes: ["Amberwood", "Ambergris", "Hedione"],
    baseNotes: ["Fir resin", "Cedar", "Musk"],
    longevity: "10-12 hours",
    occasion: "Signature",
    description:
      "A luminous amber-woody scent with airy sweetness, polished warmth, and memorable projection.",
    image: "/products/sera.png",
  },
];

export const productOccasions = Array.from(
  new Set(products.map((product) => product.occasion)),
).sort();

export const getProductBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);
