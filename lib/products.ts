import type { Product } from "@/types/product";

// Central product catalog data. Phase 2 keeps this local and typed until a backend is introduced.
export const products: Product[] = [
  {
    slug: "flame",
    name: "Flame",
    inspired_by: "Versace Eros",
    gender: "Men",
    sizes: ["15ml", "30ml"],
    prices: {
      "15ml": 650,
      "30ml": 1150,
    },
    stockQuantity: 24,
    topNotes: ["Mint", "Green apple", "Lemon"],
    middleNotes: ["Tonka bean", "Ambroxan", "Geranium"],
    baseNotes: ["Vanilla", "Cedarwood", "Vetiver"],
    longevity: "8-10 hours",
    occasion: "Evening",
    description:
      "A bold, magnetic scent with crisp freshness, warm sweetness, and confident depth for evening wear.",
    imagePath: "/products/flame.png",
  },
  {
    slug: "rosee",
    name: "Rosee",
    inspired_by: "Miss Dior",
    gender: "Women",
    sizes: ["15ml", "30ml"],
    prices: {
      "15ml": 620,
      "30ml": 1100,
    },
    stockQuantity: 31,
    topNotes: ["Mandarin", "Bergamot", "Pink pepper"],
    middleNotes: ["Rose", "Peony", "Jasmine"],
    baseNotes: ["White musk", "Patchouli", "Amberwood"],
    longevity: "6-8 hours",
    occasion: "Daily",
    description:
      "A soft floral signature with polished citrus brightness and a graceful musky finish.",
    imagePath: "/products/rosee.png",
  },
  {
    slug: "velour",
    name: "Velour",
    inspired_by: "Yves Saint Laurent Libre",
    gender: "Women",
    sizes: ["15ml", "30ml"],
    prices: {
      "15ml": 700,
      "30ml": 1250,
    },
    stockQuantity: 18,
    topNotes: ["Lavender", "Mandarin", "Blackcurrant"],
    middleNotes: ["Orange blossom", "Jasmine", "Neroli"],
    baseNotes: ["Vanilla", "Musk", "Cedar"],
    longevity: "7-9 hours",
    occasion: "Formal",
    description:
      "A sleek floral amber profile with aromatic lift, creamy warmth, and a dressed-up finish.",
    imagePath: "/products/velour.png",
  },
  {
    slug: "poseidon",
    name: "Poseidon",
    inspired_by: "Acqua di Gio Profumo",
    gender: "Men",
    sizes: ["15ml", "30ml"],
    prices: {
      "15ml": 680,
      "30ml": 1200,
    },
    stockQuantity: 27,
    topNotes: ["Sea notes", "Bergamot", "Grapefruit"],
    middleNotes: ["Sage", "Rosemary", "Geranium"],
    baseNotes: ["Incense", "Patchouli", "Mineral amber"],
    longevity: "7-9 hours",
    occasion: "Office",
    description:
      "A refined aquatic aromatic fragrance with mineral freshness and a smoky masculine base.",
    imagePath: "/products/poseidon.png",
  },
  {
    slug: "sera",
    name: "Sera",
    inspired_by: "Maison Francis Kurkdjian Baccarat Rouge 540",
    gender: "Unisex",
    sizes: ["15ml", "30ml"],
    prices: {
      "15ml": 780,
      "30ml": 1400,
    },
    stockQuantity: 15,
    topNotes: ["Saffron", "Jasmine", "Orange zest"],
    middleNotes: ["Amberwood", "Ambergris", "Hedione"],
    baseNotes: ["Fir resin", "Cedar", "Musk"],
    longevity: "10-12 hours",
    occasion: "Signature",
    description:
      "A luminous amber-woody scent with airy sweetness, polished warmth, and memorable projection.",
    imagePath: "/products/sera.png",
  },
];

export const productOccasions = Array.from(
  new Set(products.map((product) => product.occasion)),
).sort();

export const getProductBySlug = (slug: string) =>
  products.find((product) => product.slug === slug);
