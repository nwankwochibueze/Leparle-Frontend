import React, { useState } from "react";
import { useAppDispatch } from "../../store/hooks";
import { addToCart } from "../../store/CartSlice";

interface ColorVariant {
  color: string;
  colorCode: string;
  images: string[];
  altText?: string;
}

interface ProductImage {
  id: string;
  images: string[];
  altText?: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  category?: string;
  defaultColor?: string;
  defaultColorCode?: string;
  colorVariants?: ColorVariant[];
}

interface ProductSectionProps {
  products?: ProductImage[];
}

const ProductCard: React.FC<{ product: ProductImage; index: number }> = ({
  product,
  index,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(
    null
  );
  const dispatch = useAppDispatch();

  const getCurrentImages = (): string[] => {
    if (
      selectedColorIndex !== null &&
      product.colorVariants?.[selectedColorIndex]
    ) {
      return product.colorVariants[selectedColorIndex].images;
    }
    return product.images || [];
  };

  const images = getCurrentImages();
  const hasMultipleImages = images.length > 1;
  const hasColorVariants = (product.colorVariants?.length || 0) > 0;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserInteracted(true);
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUserInteracted(true);
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseEnter = () => {
    if (!userInteracted && hasMultipleImages) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
    setUserInteracted(false);
  };

  const handleColorSwatchClick = (e: React.MouseEvent, colorIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorIndex(colorIndex);
    setCurrentImageIndex(0);
    setUserInteracted(false);
  };

  const productId = product.id || `featured-${index}`;

  const getCurrentAltText = (): string => {
    if (
      selectedColorIndex !== null &&
      product.colorVariants?.[selectedColorIndex]?.altText
    ) {
      return product.colorVariants[selectedColorIndex].altText;
    }
    return product.altText || product.name || `Product ${index + 1}`;
  };

  const getCurrentColorName = (): string => {
    if (
      selectedColorIndex !== null &&
      product.colorVariants?.[selectedColorIndex]
    ) {
      return product.colorVariants[selectedColorIndex].color;
    }
    return product.defaultColor || "default";
  };

  const handleProductClick = () => {
    window.location.href = `/products/${productId}?color=${getCurrentColorName()}`;
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentImage = images[currentImageIndex] || images[0];
    const colorName = getCurrentColorName();

    const cartItem = {
      _id: product.id,
      title: product.name,
      imageUrl: currentImage,
      price: product.price,
      quantity: 1,
      selectedSize: colorName,
    };

    dispatch(addToCart(cartItem));
  };

  // Determine color swatch visibility
  const shouldShowSwatches = hasColorVariants || (product.defaultColorCode && product.images.length > 0);

  return (
    <div
      className="bg-white overflow-hidden transition-all duration-300 cursor-pointer relative"
      onClick={handleProductClick}
    >
      {/* Product Image Container */}
      <div
        className="relative w-full aspect-[3/4] overflow-hidden bg-gray-50 group"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {images.length > 0 ? (
          <img
            src={images[currentImageIndex]}
            alt={getCurrentAltText()}
            className="w-full h-full object-cover object-center transition-opacity duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (
                target.src !==
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage Not Found%3C/text%3E%3C/svg%3E"
              ) {
                console.error(
                  `Failed to load image: ${images[currentImageIndex]}`
                );
                target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3EImage Not Found%3C/text%3E%3C/svg%3E";
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            No Image
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
              aria-label="Previous image"
              type="button"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md"
              aria-label="Next image"
              type="button"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Progress Indicators */}
            <div className="absolute bottom-0 left-0 w-full flex z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                    setUserInteracted(true);
                  }}
                  className={`h-1 transition-all duration-300 flex-1 ${
                    idx === currentImageIndex
                      ? "w-6 bg-gray-800"
                      : "w-1.5 bg-gray-400 hover:bg-gray-600"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                  type="button"
                />
              ))}
            </div>
          </>
        )}

        {/* Shopping Bag Icon */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 right-4 bg-transparent group-hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-md border border-transparent group-hover:border-gray-200"
          aria-label="Add to bag"
          type="button"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </button>
      </div>

      {/* Product Details */}
      <div className="p-6 text-center bg-white">
        <h3 className="text-base font-bold text-gray-900 mb-3 leading-tight">
          {product.name || "Unnamed Product"}
        </h3>
        {product.price !== undefined && (
          <p className="text-gray-500 font-normal text-md mb-4">
            ₦
            {product.price.toLocaleString("en-NG", {
              minimumFractionDigits: 2,
            })}
          </p>
        )}

        {/* ✅ FIXED: Only show swatches if product has defaultColorCode OR has color variants */}
        {shouldShowSwatches && (
          <div className="flex gap-2 justify-center">
            {/* Main/Default color swatch - only show if defaultColorCode exists */}
            {product.defaultColorCode && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedColorIndex(null);
                  setCurrentImageIndex(0);
                  setUserInteracted(false);
                }}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  selectedColorIndex === null
                    ? "border-gray-800 border-2 ring-1 ring-gray-400 ring-offset-1"
                    : "border-gray-300 hover:border-gray-500"
                }`}
                style={{ backgroundColor: product.defaultColorCode }}
                aria-label="Default color"
                title={product.defaultColor || "Default Color"}
                type="button"
              />
            )}

            {/* Color variant swatches */}
            {product.colorVariants?.map((variant, idx) => (
              <button
                key={idx}
                onClick={(e) => handleColorSwatchClick(e, idx)}
                className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                  selectedColorIndex === idx
                    ? "border-gray-800 border-2 ring-1 ring-gray-400 ring-offset-1"
                    : "border-gray-300 hover:border-gray-500"
                }`}
                style={{ backgroundColor: variant.colorCode }}
                aria-label={`${variant.color} variant`}
                title={variant.color}
                type="button"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductSection: React.FC<ProductSectionProps> = ({ products }) => {
  if (!products || products.length === 0) {
    return (
      <section className="py-16 px-4 bg-white">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No featured products available.</p>
          <p className="text-sm text-gray-400">
            Add products from the admin panel to display them here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center text-gray-900 tracking-wide">
          Featured Products
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id || index}
              product={product}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;