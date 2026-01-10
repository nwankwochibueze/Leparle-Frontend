import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import TopBanner from "../components/topbanner/TopBanner";
import NavBar from "../components/nav/NavBar";
import Footer from "./Footer";
import FullPageLoader from "../components/ui/FullPageLoader";

const MainLayout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomeRoute = location.pathname === "/";

  const [homeReady, setHomeReady] = useState(!isHomeRoute);

  useEffect(() => {
    if (!isHomeRoute) return;

    let isMounted = true;

    const loadHome = async () => {
      try {
        // minimum loader time for smooth UX
        await Promise.all([
          axios.get("http://localhost:5000/homepage"),
          new Promise((res) => setTimeout(res, 600)),
        ]);

        if (isMounted) setHomeReady(true);
      } catch (err) {
        console.error("Homepage preload failed", err);
        if (isMounted) setHomeReady(true); // fail gracefully
      }
    };

    loadHome();

    return () => {
      isMounted = false;
    };
  }, [isHomeRoute]);

  if (isAdminRoute) return <Outlet />;

  if (!homeReady) {
    return <FullPageLoader />;
  }

  // --- DYNAMIC PADDING FOR THE MAIN CONTENT ---
  // On non-homepage routes, add padding to account for the fixed navbar.
  const mainContentPadding = isHomeRoute ? "" : "pt-10";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBanner />
      <NavBar />
      <main className={`flex-1 my-4 px-4 ${mainContentPadding}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;