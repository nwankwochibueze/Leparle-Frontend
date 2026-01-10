import React from 'react';

const FilterSidebarSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-300 rounded w-3/4 mb-6"></div>
      <div className="mb-6">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="h-2 bg-gray-300 rounded mb-2"></div>
        <div className="h-2 bg-gray-300 rounded w-5/6"></div>
      </div>
      <div className="mb-6">
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-4/5"></div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebarSkeleton;