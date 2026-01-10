// src/context/homepage/HomepageProvider.tsx
import { useEffect, useState } from "react";
import axios from "axios";
import { HomepageContext } from "./HomepageContext";
import type { HeroBlock } from "../../types/homepage";

export const HomepageProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<HeroBlock | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepage = async () => {
      try {
        const res = await axios.get("http://localhost:5000/homepage");
        setData(res.data.data[0]);
      } catch (err) {
        console.error("Homepage fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepage();
  }, []);

  return (
    <HomepageContext.Provider value={{ data, loading }}>
      {children}
    </HomepageContext.Provider>
  );
};
