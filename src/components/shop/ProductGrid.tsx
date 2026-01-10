// src/components/shop/ProductGrid.tsx - WITH COPYABLE PRICES
import { useState } from "react";
import { Link } from "react-router-dom";
import PriceDisplay from "../pricedisplay/PriceDisplay";
import { createProductSlug } from "../../utils/urlSlug";
import { useAppDispatch } from "../../store/hooks";
import { addToCart } from "../../store/CartSlice";

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
  images: string[];
  featured?: boolean;
  onSale?: boolean;
  category?: string;
  colors?: string[];
  stock?: number;
  defaultColor?: string;
  defaultColorCode?: string;
  colorVariants?: ColorVariant[];
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p className="text-xl mb-2">No products found</p>
        <p className="text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

const ProductCard = ({ product }: { product: Product }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const dispatch = useAppDispatch();
  
  const getCurrentImages = (): string[] => {
    if (selectedColorIndex !== null && product.colorVariants?.[selectedColorIndex]) {
      return product.colorVariants[selectedColorIndex].images;
    }
    return product.images || [];
  };

  const images = getCurrentImages();
  const hasMultipleImages = images.length > 1;
  const hasColorVariants = (product.colorVariants?.length || 0) > 0;
  
  const productSlug = createProductSlug(product.name, product.id);

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

  const handleColorSwatchClick = (e: React.MouseEvent, colorIndex: number | null) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColorIndex(colorIndex);
    setCurrentImageIndex(0);
    setUserInteracted(false);
  };

  const getCurrentColorName = (): string => {
    if (selectedColorIndex !== null && product.colorVariants?.[selectedColorIndex]) {
      return product.colorVariants[selectedColorIndex].color;
    }
    return product.defaultColor || "default";
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

  const shouldShowSwatches = hasColorVariants || (product.defaultColorCode && product.images.length > 0);

  return (
    <div className="group block">
      <div className="bg-white overflow-hidden transition">
        {/* Image Container with Badges and Arrows - Wrapped in Link */}
        <Link to={`/products/${productSlug}`}>
          <div
            className="relative aspect-square overflow-hidden cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Image */}
            {images.length > 0 ? (
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-500"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
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
                  className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md z-10"
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
                  className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-md z-10"
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
              className="cursor-pointer absolute bottom-4 right-4 bg-transparent group-hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 group-hover:shadow-md border border-transparent group-hover:border-gray-200"
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

            {/* Badges */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              {product.onSale && (
                <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 shadow-lg">
                  SALE
                </span>
              )}
              {product.featured && !product.onSale && (
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 shadow-lg">
                  FEATURED
                </span>
              )}
            </div>
          </div>
        </Link>

        {/* Product Details - NOT wrapped in Link */}
        <div className="p-6 text-center bg-white">
          {/* Product Name - Wrapped in Link */}
          <Link to={`/products/${productSlug}`}>
            <h3 className="text-base font-bold text-gray-900 mb-3 leading-tight hover:text-gray-700 cursor-pointer">
              {product.name}
            </h3>
          </Link>

          {/* Price - NO Link wrapper, fully copyable */}
          <div className="mb-4 flex justify-center">
            <PriceDisplay
              price={product.price}
              salePrice={product.salePrice}
              onSale={product.onSale}
              size="small"
            />
          </div>

          {/* Color Variant Swatches */}
          {shouldShowSwatches && (
            <div className="flex gap-2 justify-center">
              {/* Default Color Swatch */}
              {product.defaultColorCode && product.images.length > 0 && (
                <button
                  onClick={(e) => handleColorSwatchClick(e, null)}
                  className={`w-4 h-4 rounded-full cursor-pointer border transition-all duration-200 ${
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

              {/* Color Variant Swatches */}
              {product.colorVariants?.map((variant, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleColorSwatchClick(e, idx)}
                  className={`w-4 h-4 rounded-full cursor-pointer border transition-all duration-200 ${
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
    </div>
  );
};

export default ProductGrid;