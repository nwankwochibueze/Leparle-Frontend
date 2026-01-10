import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { axiosInstance } from "../../config/api";
import axios from "axios";
import { useAppDispatch } from "../../store/hooks";
import { addToCart } from "../../store/CartSlice";
import Accordion from "../../components/Accordion";
import CartModal from "../../components/CartModal";
import PriceDisplay from "../../components/pricedisplay/PriceDisplay";
import { extractIdFromSlug } from "../../utils/urlSlug";
import type { CartProduct } from "../../store/type";


interface ColorVariant {
  color: string;
  colorCode: string;
  images: string[];
  altText?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  description?: string;
  images: string[];
  category?: string;
  stock?: number;
  featured?: boolean;
  onSale?: boolean;
  colors?: string[];
  sizes?: string[];
  defaultColor?: string;
  defaultColorCode?: string;
  colorVariants?: ColorVariant[];
}

const ProductPage = () => {
  const { id: slugParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalProduct, setModalProduct] = useState<CartProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null
  );

  //  Get available sizes 
  const getAvailableSizes = (): string[] => {
    if (!product?.sizes || product.sizes.length === 0) {
      return [];
    }
    return product.sizes;
  };

  const availableSizes = getAvailableSizes();

  // Get current images based on selected color
  const getCurrentImages = (): string[] => {
    if (!product) return [];

    if (
      selectedColorIndex !== null &&
      product.colorVariants?.[selectedColorIndex]
    ) {
      return product.colorVariants[selectedColorIndex].images;
    }
    return product.images || [];
  };

  const currentImages = getCurrentImages();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slugParam) {
        setError("No product ID provided");
        setLoading(false);
        return;
      }

      try {
        // Extract actual ID from slug
        const id = extractIdFromSlug(slugParam);
        console.log("🔍 Fetching product with ID:", id);
        setError(null);

        const isFeaturedProduct = id.startsWith("featured-");

        if (isFeaturedProduct) {
          console.log("📦 Fetching featured product from homepage...");
         const homepageResponse = await axiosInstance.get("/homepage");
          const homepages = Array.isArray(homepageResponse.data)
            ? homepageResponse.data
            : homepageResponse.data.data || [];

          interface FeaturedProduct {
            id: string;
            name?: string;
            price?: number;
            salePrice?: number;
            images?: string[];
            description?: string;
            defaultColor?: string;
            defaultColorCode?: string;
            colorVariants?: ColorVariant[];
            sizes?: string[];
          }

          let foundProduct: FeaturedProduct | null = null;
          for (const homepage of homepages) {
            if (homepage.productImages) {
              const product = homepage.productImages.find(
                (p: FeaturedProduct) => p.id === id
              );
              if (product) {
                foundProduct = product;
                break;
              }
            }
          }

          if (foundProduct) {
            console.log("✅ Found featured product:", foundProduct);

            const colorParam = searchParams.get("color");
            let initialColorIndex = null;

            if (colorParam && foundProduct.colorVariants) {
              initialColorIndex = foundProduct.colorVariants.findIndex(
                (v: ColorVariant) =>
                  v.color.toLowerCase() === colorParam.toLowerCase()
              );
              if (initialColorIndex === -1) initialColorIndex = null;
            }

            setSelectedColorIndex(initialColorIndex);

            setProduct({
              id: foundProduct.id,
              name: foundProduct.name || "Featured Product",
              price: foundProduct.price || 0,
              salePrice: foundProduct.salePrice,
              images: foundProduct.images || [],
              description:
                foundProduct.description ||
                "Featured product from our collection",
              sizes: foundProduct.sizes || [],
              colors: [],
              stock: 50,
              onSale: false,
              featured: true,
              defaultColor: foundProduct.defaultColor,
              defaultColorCode: foundProduct.defaultColorCode,
              colorVariants: foundProduct.colorVariants || [],
            });
          } else {
            setError("Featured product not found");
          }
        } else {
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);

          if (!isValidObjectId) {
            console.error("❌ Invalid product ID format:", id);
            setError("Invalid product ID format");
            setLoading(false);
            return;
          }

          const response = await axiosInstance.get(`/products/${id}`);

          if (response.data) {
            console.log("✅ Product found:", response.data);
            setProduct({
              id: response.data._id || response.data.id,
              name: response.data.name,
              price: response.data.price,
              salePrice: response.data.salePrice,
              description: response.data.description,
              images: response.data.images || [],
              category: response.data.category,
              stock: response.data.stock,
              featured: response.data.featured,
              onSale: response.data.onSale,
              colors: response.data.colors,
              sizes: response.data.sizes || [],
              defaultColor: response.data.defaultColor,
              defaultColorCode: response.data.defaultColorCode,
              colorVariants: response.data.colorVariants || [],
            });
          }
        }
      } catch (err) {
        console.error("❌ Error fetching product:", err);

        if (axios.isAxiosError(err)) {
          if (err.response?.status === 404) {
            setError("Product not found");
          } else if (err.code === "ERR_NETWORK") {
            setError("Network error. Please check your connection.");
          } else {
            setError("Failed to load product. Please try again later.");
          }
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slugParam, searchParams]);

  const getCurrentColorName = (): string => {
    if (
      selectedColorIndex !== null &&
      product?.colorVariants?.[selectedColorIndex]
    ) {
      return product.colorVariants[selectedColorIndex].color;
    }
    return product?.defaultColor || "default";
  };

  // Check if size is in the product's sizes array
  const isSizeAvailable = (size: string): boolean => {
    if (!product?.sizes) return false;
    return product.sizes.includes(size);
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    // Check if selected size is available
    if (!isSizeAvailable(selectedSize)) {
      alert("This size is not available");
      return;
    }

    if (product.stock === 0) {
      alert("This product is out of stock");
      return;
    }

    // Use sale price if available, otherwise use regular price
    const effectivePrice =
      product.onSale && product.salePrice ? product.salePrice : product.price;

    const cartItem: CartProduct = {
      _id: product.id,
      title: product.name,
      price: effectivePrice,
      imageUrl: currentImages[selectedImageIndex] || currentImages[0] || "",
      selectedSize: `${selectedSize} - ${getCurrentColorName()}`,
      quantity,
    };

    dispatch(addToCart(cartItem));
    setModalProduct(cartItem);
    setShowModal(true);
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    if (!isSizeAvailable(selectedSize)) {
      alert("This size is not available");
      return;
    }

    if (product?.stock === 0) {
      alert("This product is out of stock");
      return;
    }

    handleAddToCart();
    setTimeout(() => {
      navigate("/cart");
    }, 1000);
  };

  const handleColorSwatchClick = (colorIndex: number | null) => {
    setSelectedColorIndex(colorIndex);
    setSelectedImageIndex(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            {error || "Product Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error === "Invalid product ID format"
              ? "The product link appears to be invalid."
              : "The product you're looking for doesn't exist or has been removed."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-900 text-white px-6 py-3 rounded hover:bg-gray-800 transition font-semibold"
            >
              Return to Home
            </button>
            <button
              onClick={() => navigate("/store")}
              className="w-full border-2 border-gray-900 text-gray-900 px-6 py-3 rounded hover:bg-gray-100 transition font-semibold"
            >
              Browse Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const hasColorVariants = (product.colorVariants?.length || 0) > 0;

  // Regular products will show a swatch with their first image
  const shouldShowSwatches =
    product.images.length > 0 &&
    (hasColorVariants ||
      product.defaultColorCode ||
      !product.id.startsWith("featured-")); // Show for all regular products

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side: Product Images */}
        <div className="space-y-3">
          {/* Main Large Image  */}
          <div className="relative aspect-[1/1] bg-gray-100 overflow-hidden max-w-md mx-auto lg:max-w-none">
            {currentImages.length > 0 ? (
              <img
                src={currentImages[selectedImageIndex]}
                alt={`${product.name} - Image ${selectedImageIndex + 1}`}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.png";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images  */}
          {currentImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto lg:max-w-none">
              {currentImages.map((image, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[1/1] bg-gray-100 overflow-hidden cursor-pointer transition-all ${
                    selectedImageIndex === idx
                      ? "ring-2 ring-gray-900 ring-offset-2"
                      : "hover:opacity-75"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.png";
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col">
          {/* Product Title and Badges */}
          <div className="mb-2 flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-medium text-gray-900">
              {product.name}
            </h1>
            {product.onSale && (
              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 ">
                ON SALE
              </span>
            )}
            {product.featured && !product.onSale && (
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1">
                FEATURED
              </span>
            )}
          </div>

          {/* Price */}
          <div className="mb-6">
            <PriceDisplay
              price={product.price}
              salePrice={product.salePrice}
              onSale={product.onSale}
              size="medium"
              className="text-gray-600 font-medium" 
            />
          </div>

          {/* Horizontal Line */}
          <div className="border-t border-gray-300 mb-6"></div>

          {/* ✅ FIX: Color Swatches - Made slightly larger */}
          {shouldShowSwatches && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-900">
                  Color
                </label>
              </div>
              <div className="flex gap-3">
                {/* Default Color Swatch - Always show if product has images */}
                {product.images.length > 0 && (
                  <button
                    onClick={() => handleColorSwatchClick(null)}
                    className="flex flex-col items-center gap-1 group"
                    type="button"
                  >
                    <div
                      className={`w-20 h-20 bg-gray-100 overflow-hidden transition-all ${
                        selectedColorIndex === null
                          ? "ring-2 ring-black ring-offset-2"
                          : "ring-1 ring-gray-200 group-hover:ring-gray-400"
                      }`}
                    >
                      <img
                        src={product.images[0]}
                        alt={product.defaultColor || "Default"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        selectedColorIndex === null
                          ? "text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {product.defaultColor || product.colors?.[0] || "Default"}
                    </span>
                  </button>
                )}

                {/* Color Variant Swatches */}
                {product.colorVariants?.map((variant, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleColorSwatchClick(idx)}
                    className="flex flex-col items-center gap-1 group"
                    type="button"
                  >
                    <div
                      className={`w-20 h-20 bg-gray-100 overflow-hidden transition-all ${
                        selectedColorIndex === idx
                          ? "ring-2 ring-black ring-offset-2"
                          : "ring-1 ring-gray-200 group-hover:ring-gray-400"
                      }`}
                    >
                      <img
                        src={variant.images[0]}
                        alt={variant.color}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.png";
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        selectedColorIndex === idx
                          ? "text-gray-900"
                          : "text-gray-600"
                      }`}
                    >
                      {variant.color}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ✅Size Selector  */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-900">
                Size
              </label>
            </div>

            {availableSizes.length > 0 ? (
              <div
                className={`grid gap-1 ${
                  availableSizes.length > 10 ? "grid-cols-10" : "grid-cols-8"
                }`}
              >
                {availableSizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-xs font-medium border transition-all max-w-[60px] ${
                      selectedSize === size
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-900 cursor-pointer"
                    } ${isOutOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={isOutOfStock}
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">
                No sizes available for this product
              </p>
            )}
          </div>

          {/* Quantity Selector  */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Quantity
            </label>
            <div className="flex items-center border border-gray-300 w-fit">
              <button
                type="button"
                onClick={() => setQuantity((q: number) => Math.max(1, q - 1))}
                className="px-4 py-2 hover:bg-gray-100 transition text-sm font-normal"
                disabled={isOutOfStock}
              >
                -
              </button>
              <span className="px-5 py-2 border-x border-gray-300 min-w-[50px] text-center text-sm font-normal">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (product.stock && quantity < product.stock) {
                    setQuantity((q: number) => q + 1);
                  } else if (!product.stock) {
                    setQuantity((q: number) => q + 1);
                  }
                }}
                className="px-4 py-2 hover:bg-gray-100 transition text-sm font-normal"
                disabled={
                  isOutOfStock ||
                  (product.stock !== undefined && quantity >= product.stock)
                }
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons  */}
          <div className="space-y-2 mb-8">
            <button
              onClick={handleAddToCart}
              className="border border-gray-900 text-gray-900 px-5 py-3 w-full hover:bg-gray-900 hover:text-white transition font-normal text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-900"
              disabled={isOutOfStock}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="
    w-full
    px-5 py-3
    text-sm font-normal
    transition-all

    bg-black text-white
    border border-black

    hover:bg-neutral-900 hover:border-neutral-900

    disabled:bg-neutral-300
    disabled:border-neutral-300
    disabled:text-neutral-500
    disabled:cursor-not-allowed
  "
            >
              {isOutOfStock ? "Unavailable" : "Checkout"}
            </button>
          </div>

          {/* Accordions */}
          <div className="w-full border-t border-gray-300 pt-6">
            <Accordion title="PRODUCT INFO" showBorder={true}>
              {product.description ||
                "High-quality product with excellent craftsmanship. Perfect for everyday use and special occasions."}
            </Accordion>
            <Accordion title="RETURN AND REFUND POLICY" showBorder={false}>
              We want you to be completely satisfied with your purchase. If for
              any reason you're not happy, you may request a refund within 14
              days of delivery. Items must be unused and in original packaging.
            </Accordion>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {showModal && modalProduct && (
        <CartModal product={modalProduct} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default ProductPage;
