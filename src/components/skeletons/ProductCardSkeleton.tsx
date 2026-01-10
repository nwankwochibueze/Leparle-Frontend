// src/components/shop/skeletons/ProductCardSkeleton.jsx

import React from 'react';

const ProductCardSkeleton = () => {
  return (
    // The 'animate-pulse' class from Tailwind CSS creates the shimmer effect
    <div className="animate-pulse">
      {/* Placeholder for the product image */}
      <div className="bg-gray-300 h-64 rounded-lg mb-4"></div>
      
      {/* Placeholder for the product title */}
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      
      {/* Placeholder for the product price */}
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
};

export default ProductCardSkeleton;