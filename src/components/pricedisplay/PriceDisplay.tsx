import React from "react";

interface PriceDisplayProps {
  price: number;
  salePrice?: number;
  onSale?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  salePrice,
  onSale = false,
  size = "medium",
  className = "",
}) => {
  const formatPrice = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const sizeClasses = {
    small: {
      original: "text-sm",
      sale: "text-base font-semibold",
      spacing: "gap-2",
    },
    medium: {
      original: "text-base",
      sale: "text-xl font-bold",
      spacing: "gap-2",
    },
    large: {
      original: "text-lg",
      sale: "text-2xl font-bold",
      spacing: "gap-3",
    },
  };

  const currentSize = sizeClasses[size];

  const showSalePrice = onSale && salePrice && salePrice < price;

  if (showSalePrice) {
    return (
      <div className={`flex items-center ${currentSize.spacing} ${className}`}>
        <span 
          className={`${currentSize.original} text-gray-600 line-through decoration-2`}
          style={{ userSelect: 'text' }} 
        >
          {formatPrice(price)}
        </span>
        <span 
          className={`${currentSize.sale} text-gray-600`}
          style={{ userSelect: 'text' }}
        >
          {formatPrice(salePrice)}
        </span>
      </div>
    );
  }

  return (
    <span 
      className={`${currentSize.sale} text-gray-600 ${className}`}
      style={{ userSelect: 'text' }}
    >
      {formatPrice(price)}
    </span>
  );
};

export default PriceDisplay;