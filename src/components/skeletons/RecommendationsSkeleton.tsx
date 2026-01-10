import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

const RecommendationsSkeleton = () => {
  // Create an array of 6 items to map over
  const skeletonItems = Array(6).fill(0);

  return (
    // recommendations section
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {skeletonItems.map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
};

export default RecommendationsSkeleton;