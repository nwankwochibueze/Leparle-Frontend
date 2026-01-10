import { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  UserIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { logout } from "../../store/slices/authSlice";
import authService from "../../services/authService";
import SearchOverlay from "../searchoverlay/SearchOverlay";

const navLinks = [
  { path: "/shop", name: "Shop" },
  { path: "/sale", name: "Sale" },
  { path: "/store", name: "Store" },
  { path: "/customercare", name: "Customer Care" },
];

const NavBar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const [navOpen, setNavOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const cartItemCount = useAppSelector((state) => state.cart.totalQuantity);
  const auth = useAppSelector((state) => state.auth);
  const isAuthenticated = auth?.isAuthenticated || false;
  const user = auth?.user;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (navOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [navOpen]);

  const toggleNav = () => {
    if (!menuAnimating) {
      setMenuAnimating(true);
      setNavOpen(!navOpen);
      setTimeout(() => setMenuAnimating(false), 500); // Match the transition duration
    }
  };

  const handleLogout = () => {
    authService.clearUserAuth();
    dispatch(logout());
    setShowUserMenu(false);
    navigate("/");
  };

  // The navbar should be "solid" if it's not the homepage, or if it's scrolled/hovered on the homepage.
  const shouldBeSolid = !isHomePage || scrolled || isHovered;

  const navbarClasses = shouldBeSolid
    ? "bg-white"
    : "bg-transparent";

  const linkClasses = shouldBeSolid
    ? "text-gray-900"
    : "text-white";

  const iconClasses = shouldBeSolid
    ? "text-gray-900"
    : "text-white";

  return (
    <>
      <nav
        className={`fixed top-11 left-0 right-0 w-full px-6 py-4 flex items-center z-50 transition-all duration-300 ${navbarClasses}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left Links - Desktop */}
        <div className="hidden md:flex flex-1">
          <ul className="flex space-x-6">
            {navLinks.map(({ path, name }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `${linkClasses} font-medium transition-colors ${
                      isActive ? (shouldBeSolid ? "text-blue-900 font-bold" : "text-white font-bold") : "hover:opacity-70"
                    }`
                  }
                >
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Menu Icon - Left side for mobile only */}
        <div className="md:hidden mr-2" onClick={toggleNav}>
          <Bars3Icon className={`h-6 w-6 cursor-pointer ${iconClasses}`} />
        </div>

        {/* Logo - Center on desktop, left of menu on mobile */}
        <div className="flex-shrink-0 flex justify-center md:flex-1">
          <Link to="/">
            <h1 className={`text-2xl font-bold cursor-pointer ${linkClasses}`}>
              LeParle`
            </h1>
          </Link>
        </div>

        {/* Right Icons */}
        <div className="flex-1 flex justify-end items-end space-x-4">
          {/* Search Icon */}
          <MagnifyingGlassIcon
            className={`h-6 w-6 cursor-pointer ${iconClasses} hover:opacity-70`}
            onClick={() => setIsSearchOpen(true)}
          />

          {/* Person Icon - hidden on mobile */}
          <div className="relative hidden md:block" ref={menuRef}>
            <UserIcon
              className={`h-6 w-6 cursor-pointer ${iconClasses} hover:opacity-70`}
              onClick={() => setShowUserMenu(!showUserMenu)}
            />
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                {/* User menu dropdown content */}
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        Hi, {user?.firstName || user?.name || user?.email?.split('@')[0] || "User"}!
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      📦 Order History
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ⚙️ Settings
                    </Link>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        Welcome!
                      </p>
                      <p className="text-xs text-gray-500">
                        Sign in to your account
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      🔐 Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium"
                      onClick={() => setShowUserMenu(false)}
                    >
                      ✨ Create Account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" className="relative">
            <ShoppingBagIcon className={`h-6 w-6 cursor-pointer ${iconClasses} hover:opacity-70`} />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile Drawer - Slides from the left with smooth transition */}
      <>
        {/* Backdrop with fade effect */}
        <div
          className={`fixed inset-0 bg-black z-40 transition-opacity duration-500 md:hidden ${
            navOpen ? "opacity-50 visible" : "opacity-0 invisible"
          }`}
          onClick={toggleNav}
        />
        
        {/* Drawer Panel - Slides from the left with enhanced animation */}
        <div
          className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform md:hidden flex flex-col ${
            navOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-500 ease-in-out`}
        >
          {/* Close button positioned exactly where the hamburger menu was */}
          <div className="absolute top-14 left-6 z-10">
            <XMarkIcon
              className="h-6 w-6 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors"
              onClick={toggleNav}
            />
          </div>

          {/* Empty space at top to account for navbar height */}
          <div className="h-20"></div>

          {/* Navigation Links with staggered animation */}
          <nav className="flex-1 overflow-y-auto">
            <ul className="py-4">
              {navLinks.map(({ path, name }, index) => (
                <li 
                  key={path}
                  className={`transition-all duration-300 transform ${
                    navOpen 
                      ? "translate-x-0 opacity-100" 
                      : "-translate-x-8 opacity-0"
                  }`}
                  style={{ 
                    transitionDelay: navOpen ? `${index * 50}ms` : '0ms'
                  }}
                >
                  <NavLink
                    to={path}
                    onClick={toggleNav}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-6 py-4 text-lg transition-colors ${
                        isActive 
                          ? "text-blue-900 font-medium border-l-4 border-blue-900 bg-blue-50" 
                          : "text-gray-900 hover:bg-gray-50"
                      }`
                    }
                  >
                    <span>{name}</span>
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Account Section with animation */}
          <div 
            className={`border-t border-gray-100 p-6 transition-all duration-300 transform ${
              navOpen 
                ? "translate-x-0 opacity-100" 
                : "-translate-x-8 opacity-0"
            }`}
            style={{ 
              transitionDelay: navOpen ? `${navLinks.length * 50}ms` : '0ms'
            }}
            ref={mobileMenuRef}
          >
            <div
              className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="flex items-center space-x-3">
                <UserIcon className="h-6 w-6 text-gray-700" />
                <span className="font-medium text-gray-900">
                  {isAuthenticated
                    ? `Hi, ${user?.firstName || user?.name || user?.email?.split('@')[0] || "User"}`
                    : "Login / Account"}
                </span>
              </div>
              <ChevronRightIcon 
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showUserMenu ? "rotate-90" : ""
                }`} 
              />
            </div>

            {/* Dropdown links with smooth height transition */}
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                showUserMenu ? "max-h-60 mt-2" : "max-h-0"
              }`}
            >
              <div className="space-y-1 pl-9">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      className="block py-2 text-sm text-gray-700 hover:text-blue-900 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        toggleNav();
                      }}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      className="block py-2 text-sm text-gray-700 hover:text-blue-900 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        toggleNav();
                      }}
                    >
                      Order History
                    </Link>
                    <Link
                      to="/settings"
                      className="block py-2 text-sm text-gray-700 hover:text-blue-900 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        toggleNav();
                      }}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        toggleNav();
                      }}
                      className="w-full text-left py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block py-2 text-sm text-gray-700 hover:text-blue-900 transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        toggleNav();
                      }}
                    >
                      Login
                    </Link>
                    <Link
                      to="/signup"
                      className="block py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      onClick={() => {
                        setShowUserMenu(false);
                        toggleNav();
                      }}
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

export default NavBar;