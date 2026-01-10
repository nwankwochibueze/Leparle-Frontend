// src/components/shop/skeletons/ProductGridSkeleton.jsx

import React from 'react';
// It imports the building block component
import ProductCardSkeleton from './ProductCardSkeleton'; 

const ProductGridSkeleton = () => {
  // Create an array of 6 items to map over, so we get 6 skeleton cards
  const skeletonItems = Array(6).fill(0);

  return (
    // This div should have the SAME grid classes as your actual ProductGrid
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {skeletonItems.map((_, index) => (
        // For each item in the array, render a ProductCardSkeleton
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;