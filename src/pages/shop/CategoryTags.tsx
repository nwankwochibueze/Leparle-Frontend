// src/components/shop/CategoryTags.tsx
import React from "react";
import type { FilterState } from "../../types/filter";
import { PRODUCT_CATEGORIES } from "../../types/filter";

interface CategoryTagsProps {
  filters: FilterState;
  onCategoryToggle: (category: string) => void;
}

const CategoryTags: React.FC<CategoryTagsProps> = ({ 
  filters, 
  onCategoryToggle 
}) => {
  // "All Products" is active when no categories are selected
  const isAllProductsActive = filters.categories.length === 0;

  const handleAllProductsClick = () => {
    // Pass a special identifier to clear all categories
    onCategoryToggle("__ALL__");
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 tracking-wide uppercase">
        Categories
      </h2>
      <div className="flex flex-wrap gap-2">
        {/* All Products Tag - Shows first */}
        <button
          onClick={handleAllProductsClick}
          className={`px-4 py-2 text-sm border transition whitespace-nowrap ${
            isAllProductsActive
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          }`}
        >
          All Products
        </button>

        {/* Individual Category Tags */}
        {PRODUCT_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryToggle(category)}
            className={`px-4 py-2 text-sm border transition whitespace-nowrap ${
              filters.categories.includes(category)
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTags;