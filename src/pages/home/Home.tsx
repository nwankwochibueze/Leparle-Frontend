import { useEffect, useState } from "react";
import { axiosInstance } from "../../config/api";
import type { HeroBlock } from "../../types/homepage";
import HeroSection from "../../components/homepage/HeroSection";
import ProductSection from "../../components/homepage/ProductSection";

const Home = () => {
  const [homeData, setHomeData] = useState<HeroBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ✅ Using axiosInstance instead of hardcoded URL
    axiosInstance
      .get("/homepage")
      .then((res) => {
        setHomeData(res.data.data[0]);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching homepage:", err);
        setError("Failed to load homepage content");
        setLoading(false);
      });
  }, []);

  // Optional: Add loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gray-900"></div>
      </div>
    );
  }

  // Optional: Add error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!homeData) return null;

  return (
    <>
      {/* 
        This wrapper uses inline styles to break out of the parent container's padding.
        This is the most reliable way to achieve full-width sections.
      */}
      <div
        style={{
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
          position: 'relative'
        }}
      >
        <HeroSection hero={homeData} />
      </div>

      {/* ProductSection and other content remain within the normal layout flow */}
      <ProductSection products={homeData.productImages} />
    </>
  );
};

export default Home;