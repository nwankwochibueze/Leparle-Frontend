import { useState, useEffect } from "react";
import { MdLocalShipping, MdPercent, MdFlashOn } from "react-icons/md";

// --- You can easily add, remove, or reorder messages here ---
const promotionalMessages = [
  {
    text: "Free delivery for orders above $1000",
    icon: <MdLocalShipping className="text-xl" />,
  },
  {
    text: "SALE. Up to 50% off. Shop Now",
    icon: <MdPercent className="text-xl" />,
  },
  {
    text: "New Arrivals. Discover the Latest Styles",
    icon: <MdFlashOn className="text-xl" />,
  },
  // Add more messages here if you like
];

const TopBanner = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Move to the next message, and loop back to the start
      setCurrentMessageIndex(
        (prevIndex) => (prevIndex + 1) % promotionalMessages.length
      );
    }, 5000); // Change message every 5000ms (5 seconds)

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []); // <-- FIX: Use an empty dependency array

  const { text, icon } = promotionalMessages[currentMessageIndex];

  return (
    <div className="bg-blue-900 text-white px-6 py-3 flex items-center justify-center sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <span className="transition-opacity duration-500 ease-in-out">
          {icon}
        </span>
        <span className="text-sm font-medium transition-opacity duration-500 ease-in-out">
          {text}
        </span>
      </div>
    </div>
  );
};

export default TopBanner;