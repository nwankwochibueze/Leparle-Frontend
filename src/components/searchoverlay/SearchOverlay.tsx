import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { RiSearchLine, RiCloseLine } from "react-icons/ri";
import { axiosInstance } from "../../config/api";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images: string[];
  category?: string;
  stock?: number;
  onSale?: boolean;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all products when overlay opens
  useEffect(() => {
    const loadAllProducts = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const response = await axiosInstance.get("/products");
        const productsData = response.data?.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
        setHasSearched(true);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      loadAllProducts();
    } else {
      // Reset state when closing
      setQuery("");
      setProducts([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Search/filter products as user types
  useEffect(() => {
    if (!isOpen) return;

    const searchProducts = async () => {
      // If no query, show all products (already loaded on open)
      if (!query.trim()) {
        return;
      }

      setLoading(true);

      try {
        const response = await axiosInstance.get(
          `/products/search?q=${encodeURIComponent(query)}`
        );
        const productsData = response.data?.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
        setHasSearched(true);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-70" : "opacity-0"
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed inset-0 bg-white z-50 transition-all duration-300 ease-out overflow-y-auto ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 relative">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-lg transition"
              aria-label="Close search"
            >
              <RiCloseLine className="text-3xl text-gray-600" />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
            </div>
          )}

          {!loading && hasSearched && query.trim() && products.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <RiSearchLine className="text-5xl mx-auto mb-3" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                Try searching with different keywords
              </p>
            </div>
          )}

          {!loading && products.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                {query.trim() ? (
                  <>
                    {products.length}{" "}
                    {products.length === 1 ? "result" : "results"} found for "
                    {query}"
                  </>
                ) : (
                  <>Showing all {products.length} products</>
                )}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    onClick={onClose}
                    className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition group"
                  >
                    <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-2 h-10">
                        {product.name}
                      </h3>

                      {product.category && (
                        <p className="text-xs text-gray-500 uppercase mb-2">
                          {product.category}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-base font-bold text-blue-900">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.onSale && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                            SALE
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchOverlay;