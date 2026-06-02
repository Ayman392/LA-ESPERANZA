"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import type { ProductFilters, ProductGender } from "@/types/product";

type ProductFiltersProps = {
  filters: ProductFilters;
  minPrice: number;
  maxPrice: number;
  occasions: string[];
  onChange: (filters: ProductFilters) => void;
};

const genderOptions: ProductFilters["gender"][] = [
  "All",
  "Men",
  "Women",
  "Unisex",
];

// Search and filter controls operate on local catalog data only.
export function ProductFilters({
  filters,
  minPrice,
  maxPrice,
  occasions,
  onChange,
}: ProductFiltersProps) {
  const updateFilters = (nextFilters: Partial<ProductFilters>) => {
    onChange({ ...filters, ...nextFilters });
  };

  return (
    <aside className="rounded-card border border-border bg-surface-strong p-5 shadow-[0_18px_55px_rgba(38,36,33,0.05)]">
      <div className="flex items-center gap-2 text-charcoal">
        <SlidersHorizontal className="size-4" aria-hidden="true" />
        <h2 className="text-sm font-semibold uppercase">Filters</h2>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-charcoal">Search</span>
        <span className="mt-2 flex h-12 items-center gap-2 rounded-full border border-border bg-background px-4 focus-within:ring-2 focus-within:ring-accent/30">
          <Search className="size-4 text-muted" aria-hidden="true" />
          <input
            value={filters.search}
            onChange={(event) => updateFilters({ search: event.target.value })}
            placeholder="Name, notes, inspiration"
            className="min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-muted"
          />
        </span>
      </label>

      <div className="mt-5">
        <p className="text-sm font-medium text-charcoal">Gender</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {genderOptions.map((gender) => (
            <button
              key={gender}
              type="button"
              onClick={() =>
                updateFilters({ gender: gender as "All" | ProductGender })
              }
              className={`h-10 rounded-full border px-3 text-sm font-medium transition ${
                filters.gender === gender
                  ? "border-charcoal bg-charcoal text-white"
                  : "border-border bg-background text-muted hover:border-accent/50 hover:text-charcoal"
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5 block">
        <span className="flex items-center justify-between gap-3 text-sm font-medium text-charcoal">
          Price range
          <span className="text-muted">
            BDT {filters.minPrice} - {filters.maxPrice}
          </span>
        </span>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={50}
          value={filters.minPrice}
          onChange={(event) =>
            updateFilters({ minPrice: Number(event.target.value) })
          }
          className="mt-3 w-full accent-[#8f7356]"
        />
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={50}
          value={filters.maxPrice}
          onChange={(event) =>
            updateFilters({ maxPrice: Number(event.target.value) })
          }
          className="mt-3 w-full accent-[#8f7356]"
        />
      </label>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-charcoal">Occasion</span>
        <select
          value={filters.occasion}
          onChange={(event) => updateFilters({ occasion: event.target.value })}
          className="mt-2 h-12 w-full rounded-full border border-border bg-background px-4 text-sm text-charcoal outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="All">All occasions</option>
          {occasions.map((occasion) => (
            <option key={occasion} value={occasion}>
              {occasion}
            </option>
          ))}
        </select>
      </label>
    </aside>
  );
}
