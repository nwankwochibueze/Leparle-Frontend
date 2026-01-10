// src/types/filter.ts
export interface FilterState {
  priceRange: [number, number];
  colors: string[];
  sizeRange: [number, number];
  showSale: boolean;
  showFeatured: boolean;
  categories: string[];
  selectedSizes: string[]; // Add this property
}

export const AVAILABLE_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "Brown", hex: "#8B4513" },
  { name: "Tan", hex: "#D2B48C" },
  { name: "Beige", hex: "#F5F5DC" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Cream", hex: "#FFFDD0" },
  { name: "Navy", hex: "#000080" },
  { name: "Blue", hex: "#0000FF" },
  { name: "Red", hex: "#FF0000" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Green", hex: "#008000" },
  { name: "Gray", hex: "#808080" },
  { name: "Silver", hex: "#C0C0C0" },
  { name: "Gold", hex: "#FFD700" },
  { name: "Pink", hex: "#FFC0CB" },
  { name: "Purple", hex: "#800080" },
  { name: "Orange", hex: "#FFA500" },
  { name: "Yellow", hex: "#FFFF00" },
];

// For shoes and bags
export const SIZE_RANGE = {
  min: 35,
  max: 46,
  step: 0.5,
};

export const PRICE_RANGE = {
  min: 0,
  max: 500000, // Adjusted for Naira
};

export const PRODUCT_CATEGORIES = [
  "Shoes",
  "Bags",
  "Sneakers",
  "Boots",
  "Handbags",
  "Backpacks",
  "Crossbody",
  "Totes",
  "Accessories",
];

// Define size options for different categories
export const SIZE_OPTIONS = {
  // Shoe categories use EU sizes
  shoes: Array.from({ length: (SIZE_RANGE.max - SIZE_RANGE.min) / SIZE_RANGE.step + 1 }, (_, i) => 
    (SIZE_RANGE.min + i * SIZE_RANGE.step).toFixed(1)
  ),
  sneakers: Array.from({ length: (SIZE_RANGE.max - SIZE_RANGE.min) / SIZE_RANGE.step + 1 }, (_, i) => 
    (SIZE_RANGE.min + i * SIZE_RANGE.step).toFixed(1)
  ),
  boots: Array.from({ length: (SIZE_RANGE.max - SIZE_RANGE.min) / SIZE_RANGE.step + 1 }, (_, i) => 
    (SIZE_RANGE.min + i * SIZE_RANGE.step).toFixed(1)
  ),
  // Bag categories use standard sizes
  bags: ["One Size", "Small", "Medium", "Large"],
  handbags: ["One Size", "Small", "Medium", "Large"],
  backpacks: ["One Size", "Small", "Medium", "Large"],
  crossbody: ["One Size", "Small", "Medium", "Large"],
  totes: ["One Size", "Small", "Medium", "Large"],
  // Accessories are typically one size
  accessories: ["One Size"],
};

// Helper function to get size options for selected categories
export const getSizeOptionsForCategories = (categories: string[]): string[] => {
  if (!categories || categories.length === 0) return [];
  
  // Get all unique size options for the selected categories
  const allSizeOptions = new Set<string>();
  
  categories.forEach(category => {
    const categoryLower = category.toLowerCase();
    if (SIZE_OPTIONS[categoryLower as keyof typeof SIZE_OPTIONS]) {
      SIZE_OPTIONS[categoryLower as keyof typeof SIZE_OPTIONS].forEach(size => {
        allSizeOptions.add(size);
      });
    }
  });
  
  return Array.from(allSizeOptions).sort((a, b) => {
    // Sort numeric sizes numerically and text sizes alphabetically
    const aIsNum = !isNaN(parseFloat(a));
    const bIsNum = !isNaN(parseFloat(b));
    
    if (aIsNum && bIsNum) {
      return parseFloat(a) - parseFloat(b);
    } else if (aIsNum) {
      return -1;
    } else if (bIsNum) {
      return 1;
    } else {
      return a.localeCompare(b);
    }
  });
};