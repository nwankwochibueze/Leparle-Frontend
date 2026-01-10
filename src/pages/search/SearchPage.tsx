import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";

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

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const apiUrl = `${
          import.meta.env.VITE_API_URL
        }/products/search?q=${encodeURIComponent(query)}`;
        console.log("🔍 Search URL:", apiUrl);
        console.log("🔍 Search Query:", query);

        const response = await axios.get(apiUrl);

        console.log("📦 Full API Response:", response);
        console.log("📦 Response Data:", response.data);
        console.log("📦 Products Array:", response.data?.data);

        // Handle the response structure from your API
        const productsData = response.data?.data || [];
        console.log("📦 Final Products:", productsData);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Search error:", err);
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : "Failed to fetch search results";
        setError(errorMessage);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900">Search Products</h1>
          <p className="text-gray-600 mt-4">
            Use the search bar above to find products
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Search Results for "{query}"
          </h1>
          {!loading && (
            <p className="text-gray-600 mt-2">
              {products.length} {products.length === 1 ? "product" : "products"}{" "}
              found
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-gray-700">
              No products found
            </h2>
            <p className="text-gray-500 mt-2">
              Try searching with different keywords
            </p>
            <Link
              to="/shop"
              className="inline-block mt-6 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition"
            >
              Browse All Products
            </Link>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="bg-white rounded-lg shadow hover:shadow-xl transition group"
              >
                {/* Product Image */}
                <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                    {product.name}
                  </h3>

                  {product.category && (
                    <p className="text-xs text-gray-500 uppercase mb-2">
                      {product.category}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-900">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.onSale && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        SALE
                      </span>
                    )}
                  </div>

                  {product.stock !== undefined && product.stock <= 0 && (
                    <p className="text-red-600 text-sm mt-2">Out of Stock</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
