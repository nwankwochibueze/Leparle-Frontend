import { useState, useEffect } from "react";
import axios from "axios";
import { HiAdjustmentsHorizontal } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";

import { axiosInstance } from "../../config/api";

import FilterSidebar from "../../components/shop/FilterSidebar";
import ProductGrid from "../../components/shop/ProductGrid";

import ProductGridSkeleton from "../../components/skeletons/ProductGridSkeleton";
import RecommendationsSkeleton from "../../components/skeletons/RecommendationsSkeleton";
import FilterSidebarSkeleton from "../../components/skeletons/FilterSidebarSkeleton";

import type { Product } from "../../types/product";
import type { FilterState } from "../../types/filter";
import { PRICE_RANGE, SIZE_RANGE } from "../../types/filter";

import { getRecommendations } from "../../utils/getRecommendation";

const Shop = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    useState(true);

  // Mobile filter drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    priceRange: [PRICE_RANGE.min, PRICE_RANGE.max],
    sizeRange: [SIZE_RANGE.min, SIZE_RANGE.max],
    colors: [],
    categories: [],
    showFeatured: false,
    showSale: false,
    selectedSizes: [],
  });

  // ============================
  // FETCH PRODUCTS (axiosInstance)
  // ============================
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await axiosInstance.get("/products");

        const products: Product[] = res.data?.data ?? [];

        setAllProducts(products);
        setFilteredProducts(products);
        setRecommended(getRecommendations(products, [], { limit: 6 }));
      } catch (err: unknown) {
        console.error("❌ Error fetching products:", err);

        if (axios.isAxiosError(err)) {
          console.error("Axios error:", err.response?.data);
        }
      } finally {
        setLoading(false);
        setIsRecommendationsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ============================
  // FILTERING + RECOMMENDATIONS
  // ============================
  useEffect(() => {
    if (allProducts.length === 0) return;

    setIsRecommendationsLoading(true);

    let filtered = [...allProducts];

    if (filters.showFeatured && !filters.showSale) {
      filtered = filtered.filter((p) => p.featured);
    }

    if (filters.showSale && !filters.showFeatured) {
      filtered = filtered.filter((p) => p.onSale);
    }

    filtered = filtered.filter(
      (p) =>
        p.price >= filters.priceRange[0] &&
        p.price <= filters.priceRange[1]
    );

    if (filters.categories.length > 0) {
      filtered = filtered.filter(
        (p) => p.category && filters.categories.includes(p.category)
      );
    }

    // Size filtering
    if (filters.selectedSizes.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.sizes) return false;
        return p.sizes.some((size) =>
          filters.selectedSizes.includes(size.toString())
        );
      });
    } else if (
      filters.sizeRange[0] !== SIZE_RANGE.min ||
      filters.sizeRange[1] !== SIZE_RANGE.max
    ) {
      filtered = filtered.filter((p) => {
        if (!p.sizes) return false;
        return p.sizes.some((size) => {
          const num = Number(size);
          return (
            !isNaN(num) &&
            num >= filters.sizeRange[0] &&
            num <= filters.sizeRange[1]
          );
        });
      });
    }

    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.colors) return false;
        return p.colors.some((c) => filters.colors.includes(c));
      });
    }

    setFilteredProducts(filtered);

    const generateRecommendations = async () => {
      const excludeCount = Math.min(3, filtered.length);
      const excludedIds = [...filtered]
        .sort(() => 0.5 - Math.random())
        .slice(0, excludeCount)
        .map((p) => p.id);

      let recs = getRecommendations(allProducts, excludedIds, { limit: 6 });

      if (recs.length === 0) {
        recs = getRecommendations(allProducts, [], { limit: 6 });
      }

      await new Promise((r) => setTimeout(r, 500));

      setRecommended(recs);
      setIsRecommendationsLoading(false);
    };

    generateRecommendations();
  }, [filters, allProducts]);

  // ============================
  // LOADING STATE
  // ============================
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-16">
        <div className="h-10 bg-gray-300 w-1/4 rounded animate-pulse" />
        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="lg:sticky lg:top-24 w-full lg:w-1/4">
            <FilterSidebarSkeleton />
          </aside>
          <main className="flex-1">
            <ProductGridSkeleton />
          </main>
        </div>
      </div>
    );
  }

  // ============================
  // RENDER
  // ============================
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Shop</h1>
        <p className="text-gray-600 text-lg">
          Discover our collection of premium products
        </p>
      </div>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          <HiAdjustmentsHorizontal className="w-5 h-5" />
          Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:sticky lg:top-24">
          <FilterSidebar filters={filters} onFilterChange={setFilters} />
        </aside>

        {/* Mobile Drawer */}
        <MobileFilterDrawer
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
        >
          <FilterSidebar filters={filters} onFilterChange={setFilters} />
        </MobileFilterDrawer>

        <main className="flex-1">
          <div className="mb-4 text-gray-600">
            Showing {filteredProducts.length} of {allProducts.length} products
          </div>

          <ProductGrid products={filteredProducts} />
        </main>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6">You may also like</h2>
        {isRecommendationsLoading ? (
          <RecommendationsSkeleton />
        ) : (
          <ProductGrid products={recommended} />
        )}
      </section>
    </div>
  );
};

// ============================
// MOBILE FILTER DRAWER
// ============================
interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-full max-w-sm bg-white z-50 transform transition-transform duration-300 lg:hidden overflow-y-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <HiAdjustmentsHorizontal className="w-5 h-5" />
            Filters
          </h2>
          <button onClick={onClose}>
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </>
  );
};

export default Shop;
