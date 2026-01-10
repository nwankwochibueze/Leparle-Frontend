import { useState, useCallback, useMemo } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import type { FilterState } from "../../types/filter";
import {
  AVAILABLE_COLORS,
  SIZE_RANGE,
  PRICE_RANGE,
  PRODUCT_CATEGORIES,
} from "../../types/filter";

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  hideAllProducts?: boolean;
}

// Define all available sizes by type
const FOOTWEAR_SIZES = [
  "35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5", 
  "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5", 
  "43", "43.5", "44", "44.5", "45", "45.5", "46"
];

const CLOTHING_SIZES = ["Small", "Medium", "Large", "One Size"];

const FilterSidebar = ({ filters, onFilterChange, hideAllProducts = false }: FilterSidebarProps) => {
  const [openSection, setOpenSection] = useState<string | null>("price");

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handlePriceChange = useCallback((value: number | number[]) => {
    onFilterChange({
      ...filters,
      priceRange: value as [number, number],
    });
  }, [filters, onFilterChange]);

  const handleSizeToggle = useCallback((size: string) => {
    const newSizes = filters.selectedSizes?.includes(size)
      ? filters.selectedSizes.filter((s) => s !== size)
      : [...(filters.selectedSizes || []), size];

    onFilterChange({ ...filters, selectedSizes: newSizes });
  }, [filters, onFilterChange]);

  const handleCategoryToggle = useCallback((category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    onFilterChange({ ...filters, categories: newCategories });
  }, [filters, onFilterChange]);

  const handleColorToggle = useCallback((color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];

    onFilterChange({ ...filters, colors: newColors });
  }, [filters, onFilterChange]);

  // Determine which size sections to show based on selected categories
  const showFootwearSizes = useMemo(() => {
    if (filters.categories.length === 0) return true; // Show all if no category selected
    return filters.categories.some(cat => 
      ["Shoes", "Sneakers", "Boots"].includes(cat)
    );
  }, [filters.categories]);

  const showClothingSizes = useMemo(() => {
    if (filters.categories.length === 0) return true; // Show all if no category selected
    return filters.categories.some(cat => 
      ["Bags", "Handbags", "Backpacks", "Crossbody", "Totes", "Accessories"].includes(cat)
    );
  }, [filters.categories]);

  return (
    <div className="w-full max-w-[260px]">
      {/* Browse By */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-4 tracking-widest uppercase text-gray-800">
          Browse By
        </h2>

        <div className="space-y-2">
          {!hideAllProducts && (
            <button
              onClick={() =>
                onFilterChange({
                  ...filters,
                  showFeatured: false,
                  showSale: false,
                })
              }
              className={`w-full text-left py-2 px-4 text-sm transition ${
                !filters.showFeatured && !filters.showSale
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              All Products
            </button>
          )}

          <button
            onClick={() =>
              onFilterChange({
                ...filters,
                showFeatured: true,
                showSale: false,
              })
            }
            className={`w-full text-left py-2 px-4 text-sm transition ${
              filters.showFeatured
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Featured Items
          </button>

          <button
            onClick={() =>
              onFilterChange({
                ...filters,
                showFeatured: false,
                showSale: true,
              })
            }
            className={`w-full text-left py-2 px-4 text-sm transition ${
              filters.showSale
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            On Sale
          </button>
        </div>
      </div>

      {/* Filter By */}
      <div>
        <h2 className="pb-2 text-sm font-semibold mb-4 tracking-widest uppercase text-gray-800 border-b border-gray-200">
          Filter By
        </h2>

        {/* Categories */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <button
            onClick={() => toggleSection("categories")}
            className="flex justify-between items-center w-full py-2"
          >
            <span className="font-medium text-gray-700">Categories</span>
            {openSection === "categories" ? <FiMinus /> : <FiPlus />}
          </button>

          {openSection === "categories" && (
            <div className="mt-4 space-y-2">
              {PRODUCT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`w-full text-left py-2 px-4 text-sm transition ${
                    filters.categories.includes(category)
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <button
            onClick={() => toggleSection("price")}
            className="flex justify-between items-center w-full py-2"
          >
            <span className="font-medium text-gray-700">Price</span>
            {openSection === "price" ? <FiMinus /> : <FiPlus />}
          </button>

          {openSection === "price" && (
            <div className="mt-4 px-2 cursor-pointer">
              <Slider
                range
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                value={filters.priceRange ?? [PRICE_RANGE.min, PRICE_RANGE.max]}
                onChange={handlePriceChange}
                allowCross={false}
                pushable={0}
                trackStyle={[{ backgroundColor: "#111", height: 2 }]}
                railStyle={{ backgroundColor: "#e5e7eb", height: 2 }}
                handleStyle={[
                  {
                    width: 14,
                    height: 14,
                    marginTop: -6,
                    backgroundColor: "#111",
                    border: "none",
                    cursor: "pointer",
                  },
                  {
                    width: 14,
                    height: 14,
                    marginTop: -6,
                    backgroundColor: "#111",
                    border: "none",
                    cursor: "pointer",
                  },
                ]}
              />

              <div className="flex justify-between mt-3 text-xs text-gray-500">
                <span>₦{filters.priceRange[0].toLocaleString()}</span>
                <span>₦{filters.priceRange[1].toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Size - Always visible with all size types */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <button
            onClick={() => toggleSection("size")}
            className="flex justify-between items-center w-full py-2"
          >
            <span className="font-medium text-gray-700">Size</span>
            {openSection === "size" ? <FiMinus /> : <FiPlus />}
          </button>

          {openSection === "size" && (
            <div className="mt-4 space-y-4">
              {/* Footwear Sizes */}
              {showFootwearSizes && (
                <div className={`px-2 ${!showFootwearSizes && filters.categories.length > 0 ? 'opacity-50' : ''}`}>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Footwear (EU)
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {FOOTWEAR_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        disabled={!showFootwearSizes && filters.categories.length > 0}
                        className={`py-2 px-2 text-xs border rounded transition ${
                          filters.selectedSizes?.includes(size)
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                        } ${!showFootwearSizes && filters.categories.length > 0 ? 'cursor-not-allowed' : ''}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Bags & Accessories Sizes */}
              {showClothingSizes && showFootwearSizes && (
                <div className="border-t border-gray-200 pt-4"></div>
              )}
              
              {showClothingSizes && (
                <div className={`px-2 ${!showClothingSizes && filters.categories.length > 0 ? 'opacity-50' : ''}`}>
                  <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Bags & Accessories
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {CLOTHING_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => handleSizeToggle(size)}
                        disabled={!showClothingSizes && filters.categories.length > 0}
                        className={`py-2 px-3 text-sm border rounded transition ${
                          filters.selectedSizes?.includes(size)
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-500"
                        } ${!showClothingSizes && filters.categories.length > 0 ? 'cursor-not-allowed' : ''}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Helper text */}
              {filters.categories.length > 0 && (
                <p className="text-xs text-gray-500 italic px-2">
                  {!showFootwearSizes && "Footwear sizes hidden based on selected categories"}
                  {!showClothingSizes && "Bag sizes hidden based on selected categories"}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Color */}
        <div>
          <button
            onClick={() => toggleSection("color")}
            className="flex justify-between items-center w-full py-2"
          >
            <span className="font-medium text-gray-700">Color</span>
            {openSection === "color" ? <FiMinus /> : <FiPlus />}
          </button>

          {openSection === "color" && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => handleColorToggle(color.name)}
                  className={`relative w-8 h-8 rounded-full border-2 transition ${
                    filters.colors.includes(color.name)
                      ? "border-gray-900 scale-105"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                >
                  {filters.colors.includes(color.name) && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() =>
          onFilterChange({
            priceRange: [PRICE_RANGE.min, PRICE_RANGE.max],
            sizeRange: [SIZE_RANGE.min, SIZE_RANGE.max],
            colors: [],
            categories: [],
            showFeatured: false,
            showSale: false,
            selectedSizes: [],
          })
        }
        className="w-full mt-8 py-2 border border-gray-300 text-xs tracking-widest uppercase hover:bg-gray-100 transition"
      >
        Clear Filters
      </button>
    </div>
  );
};

export default FilterSidebar;