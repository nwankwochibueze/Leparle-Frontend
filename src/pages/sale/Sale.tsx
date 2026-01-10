// src/pages/Sale.tsx - UPDATED WITH AXIOS INSTANCE
import { useState, useEffect } from "react";
import { HiAdjustmentsHorizontal } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import FilterSidebar from "../../components/shop/FilterSidebar";
import ProductGrid from "../../components/shop/ProductGrid";

import ProductGridSkeleton from "../../components/skeletons/ProductCardSkeleton";
import RecommendationsSkeleton from "../../components/skeletons/RecommendationsSkeleton";
import FilterSidebarSkeleton from "../../components/skeletons/FilterSidebarSkeleton";

import type { Product } from "../../types/product";
import type { FilterState } from "../../types/filter";
import { PRICE_RANGE, SIZE_RANGE } from "../../types/filter";

import { getRecommendations } from "../../utils/getRecommendation";
import { axiosInstance } from "../../config/api";

const Sale = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(true);
  
  // Mobile filter drawer state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [PRICE_RANGE.min, PRICE_RANGE.max],
    sizeRange: [SIZE_RANGE.min, SIZE_RANGE.max],
    colors: [],
    categories: [],
    showFeatured: false,
    showSale: true,
    selectedSizes: [], 
  });

  useEffect(() => {
    axiosInstance
      .get("/products")
      .then((res) => {
        const products = res.data.data || [];
        setAllProducts(products);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching sale products:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (allProducts.length === 0) return;
    setIsRecommendationsLoading(true);

    const filtered = [...allProducts].filter((p) => {
      // Must be on sale
      if (!p.onSale) return false;
      
      // Featured filter
      if (filters.showFeatured && !p.featured) return false;
      
      // Price filter - use sale price if available, otherwise use regular price
      const effectivePrice = p.salePrice || p.price;
      if (effectivePrice < filters.priceRange[0] || effectivePrice > filters.priceRange[1]) {
        return false;
      }
      
      // Category filter - handle optional category
      if (filters.categories.length > 0 && (!p.category || !filters.categories.includes(p.category))) {
        return false;
      }
      
      // Size filter - handle both range and selected sizes
      if (filters.selectedSizes && filters.selectedSizes.length > 0 && p.sizes) {
        const hasMatchingSize = p.sizes.some((size) => {
          // Convert to string for comparison
          const sizeStr = size.toString();
          return filters.selectedSizes.includes(sizeStr);
        });
        if (!hasMatchingSize) return false;
      } else if (
        filters.sizeRange[0] !== SIZE_RANGE.min ||
        filters.sizeRange[1] !== SIZE_RANGE.max
      ) {
        // Fall back to range filter if no specific sizes selected
        if (p.sizes) {
          const hasMatchingSize = p.sizes.some((size) => {
            const numSize = Number(size);
            return !isNaN(numSize) && numSize >= filters.sizeRange[0] && numSize <= filters.sizeRange[1];
          });
          if (!hasMatchingSize) return false;
        }
      }
      
      // Color filter - handle optional colors
      if (filters.colors.length > 0 && p.colors) {
        const hasMatchingColor = p.colors.some((c) => filters.colors.includes(c));
        if (!hasMatchingColor) return false;
      }
      
      return true;
    });

    setFilteredProducts(filtered);

    const getRecs = async () => {
      let recs = getRecommendations(
        allProducts,
        filtered.map((p) => p.id),
        { limit: 6, onSaleOnly: true }
      );
      if (recs.length === 0) {
        recs = getRecommendations(
          allProducts,
          filtered.map((p) => p.id),
          { limit: 6 }
        );
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecommended(recs);
      setIsRecommendationsLoading(false);
    };

    getRecs();
  }, [filters, allProducts]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
        <div className="h-10 bg-gray-300 w-1/4 rounded animate-pulse"></div>
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start w-full lg:w-1/4">
            <FilterSidebarSkeleton />
          </aside>
          <main className="flex-1">
            <ProductGridSkeleton />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Sale</h1>
        <p className="text-gray-600 text-lg">
          Grab amazing deals before they&apos;re gone
        </p>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <HiAdjustmentsHorizontal className="w-5 h-5" />
          Filters
          {(filters.categories.length > 0 || 
            filters.colors.length > 0 || 
            (filters.selectedSizes && filters.selectedSizes.length > 0)) && (
            <span className="ml-1 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
              {filters.categories.length + filters.colors.length + (filters.selectedSizes?.length || 0)}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            hideAllProducts
          />
        </aside>

        {/* Mobile Filter Drawer */}
        <MobileFilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        >
          <FilterSidebar
            filters={filters}
            onFilterChange={setFilters}
            hideAllProducts
          />
          
          {/* Apply Button */}
          <div className="sticky bottom-0 bg-white pt-6 mt-6 border-t border-gray-200">
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold"
            >
              Show {filteredProducts.length} Products
            </button>
          </div>
        </MobileFilterDrawer>

        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-gray-600">
              Showing {filteredProducts.length} sale products
            </span>
            
            {/* Active Filters Count - Desktop */}
            {(filters.categories.length > 0 || 
              filters.colors.length > 0 || 
              (filters.selectedSizes && filters.selectedSizes.length > 0)) && (
              <span className="hidden lg:block text-sm text-gray-500">
                {filters.categories.length + filters.colors.length + (filters.selectedSizes?.length || 0)} filters active
              </span>
            )}
          </div>
          
          <ProductGrid products={filteredProducts} />
        </main>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6">You may also like</h2>
        {isRecommendationsLoading ? (
          <RecommendationsSkeleton />
        ) : recommended.length > 0 ? (
          <ProductGrid products={recommended} />
        ) : null}
      </section>
    </div>
  );
};

// Mobile Filter Drawer Component with proper TypeScript types
interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({ 
  isOpen, 
  onClose, 
  children 
}) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white z-50 transform transition-transform duration-300 ease-in-out lg:hidden overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiAdjustmentsHorizontal className="w-5 h-5" />
            Filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </>
  );
};

export default Sale;