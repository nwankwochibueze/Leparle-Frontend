// src/pages/cart/Cart.tsx - OPTIMIZED WITH VALIDATION STATE PASSING
import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store/store";
import type { CartProduct } from "../../store/type";
import { MdOutlineRemoveShoppingCart } from "react-icons/md";
import { FaMinus, FaPlus, FaTrash, FaLock } from "react-icons/fa";
import { removeFromCart, updateQuantity } from "../../store/CartSlice";
import { Link } from "react-router-dom";
import PromoAndNotes from "../../components/PromoAndNotes";
import { axiosInstance } from "../../config/api";

interface CartItemWithValidation extends CartProduct {
  isAvailable?: boolean;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const {
    items: cartItems,
    discount,
    promoCode,
    orderNote,
  } = useSelector((state: RootState) => state.cart);
  const dispatch = useDispatch();
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  
  // Cart validation state
  const [validating, setValidating] = useState(false);
  const [validatedItems, setValidatedItems] = useState<CartItemWithValidation[]>([]);
  const [unavailableCount, setUnavailableCount] = useState(0);

  /**
   * Validates all cart items against database using axiosInstance
   * Marks items as available/unavailable but doesn't remove them
   */
  const validateCartItems = useCallback(async () => {
    setValidating(true);
    const validated: CartItemWithValidation[] = [];
    let unavailableCounter = 0;

    console.log("🔍 Validating cart items...");

    for (const item of cartItems) {
      // Skip featured products (they don't exist in regular products database)
      if (item._id.startsWith("featured-")) {
        console.log(`⏭️ Skipping featured product: ${item.title}`);
        validated.push({ ...item, isAvailable: true });
        continue;
      }

      try {
        // ✅ Using axiosInstance
        const response = await axiosInstance.get(`/products/${item._id}`);
        
        if (!response.data) {
          console.log(`❌ Product not found: ${item.title}`);
          validated.push({ ...item, isAvailable: false });
          unavailableCounter++;
        } else {
          console.log(`✅ Product valid: ${item.title}`);
          validated.push({ ...item, isAvailable: true });
        }
      } catch (error) {
        // Product doesn't exist or server error
        console.error(`❌ Error validating ${item.title}:`, error);
        validated.push({ ...item, isAvailable: false });
        unavailableCounter++;
      }
    }

    setValidatedItems(validated);
    setUnavailableCount(unavailableCounter);
    setValidating(false);

    // ✅ Store validation results in sessionStorage so Checkout can use them
    sessionStorage.setItem('cart_validation', JSON.stringify({
      validated,
      unavailableCount: unavailableCounter,
      timestamp: Date.now()
    }));

    console.log(`✅ Validation complete: ${unavailableCounter} unavailable items`);
  }, [cartItems]);

  // Validate cart items when page loads or cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      validateCartItems();
    } else {
      setValidatedItems([]);
      setUnavailableCount(0);
      sessionStorage.removeItem('cart_validation');
    }
  }, [cartItems.length, validateCartItems]);

  const handleRemove = (id: string, selectedSize: string) => {
    dispatch(removeFromCart({ _id: id, selectedSize }));
  };

  const handleRemoveUnavailable = () => {
    validatedItems.forEach(item => {
      if (!item.isAvailable) {
        dispatch(removeFromCart({ 
          _id: item._id, 
          selectedSize: item.selectedSize 
        }));
      }
    });
  };

  const handleIncrease = (
    _id: string,
    selectedSize: string,
    quantity: number,
    isAvailable: boolean
  ) => {
    if (!isAvailable) return; // Prevent changes to unavailable items
    
    setLoadingItemId(_id);
    setLoadingSummary(true);
    dispatch(
      updateQuantity({
        _id,
        selectedSize,
        quantity: quantity + 1,
      })
    );
    setTimeout(() => {
      setLoadingItemId(null);
      setLoadingSummary(false);
    }, 500);
  };

  const handleDecrease = (
    _id: string,
    selectedSize: string,
    quantity: number,
    isAvailable: boolean
  ) => {
    if (!isAvailable) return; // Prevent changes to unavailable items
    
    setLoadingItemId(_id);
    setLoadingSummary(true);
    dispatch(
      updateQuantity({
        _id,
        selectedSize,
        quantity: Math.max(1, quantity - 1),
      })
    );
    setTimeout(() => {
      setLoadingItemId(null);
      setLoadingSummary(false);
    }, 500);
  };

  const handleCheckout = () => {
    // Only navigate if there are available items
    const availableItems = validatedItems.filter(item => item.isAvailable);
    if (availableItems.length === 0) {
      return; // Button should be disabled anyway
    }
    
    // ✅ Validation state is already stored in sessionStorage
    navigate("/checkout");
  };

  // Calculate totals only for available items
  const availableItems = validatedItems.filter(item => item.isAvailable);
  const subtotal = availableItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  const discountAmount = discount || 0;
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="py-15 w-full lg:max-w-none px-4 lg:px-6">
      {/* Validation Loading Banner */}
      {validating && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-600 mr-3"></div>
            <p className="text-blue-800">🔍 Checking item availability...</p>
          </div>
        </div>
      )}

      {/* Unavailable Items Alert */}
      {!validating && unavailableCount > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-yellow-800 font-semibold mb-2">
                ⚠️ {unavailableCount} {unavailableCount === 1 ? 'item is' : 'items are'} no longer available
              </p>
              <p className="text-yellow-700 text-sm mb-3">
                {unavailableCount === validatedItems.length 
                  ? "All items in your cart are currently unavailable. Please explore our collection to find similar products."
                  : "Some items in your cart are no longer available. You can still checkout with the remaining items or remove the unavailable ones."}
              </p>
              <button
                onClick={handleRemoveUnavailable}
                className="text-sm bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
              >
                Remove Unavailable Items
              </button>
            </div>
          </div>
        </div>
      )}

      {cartItems.length > 0 ? (
        <div className="flex flex-col lg:flex-row lg:items-start gap-8">
          {/* Cart Items Section */}
          <div className="w-full lg:flex-[3] lg:pr-6 space-y-6">
            <div className="border-b border-gray-300 pb-3 mb-6">
              <h2 className="text-[1.5rem] font-semibold">My Cart</h2>
              {!validating && unavailableCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {availableItems.length} of {validatedItems.length} items available
                </p>
              )}
            </div>

            {/* Cart Items */}
            {validatedItems.map((item: CartItemWithValidation, index: number) => {
              const isUnavailable = item.isAvailable === false;
              
              return (
                <div
                  key={`${item._id}-${item.selectedSize}-${index}`}
                  className={`relative border-b border-gray-200 pb-6 mb-6 transition-all duration-300 ${
                    loadingItemId === item._id
                      ? "opacity-50 pointer-events-none"
                      : ""
                  } ${isUnavailable ? "bg-gray-50 opacity-60" : ""}`}
                >
                  {/* Spinner Overlay */}
                  {loadingItemId === item._id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500"></div>
                    </div>
                  )}

                  {/* Unavailable Badge */}
                  {isUnavailable && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 rounded-bl font-semibold">
                      UNAVAILABLE
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                    {/* Image + Info Block */}
                    <div className="flex flex-row gap-4 flex-1">
                      <div className="w-24 h-32 flex-shrink-0 relative">
                        <img
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.title}
                          className={`w-full h-full object-cover ${
                            isUnavailable ? "grayscale" : ""
                          }`}
                        />
                        {isUnavailable && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✕</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-between">
                        <h3 className={`font-medium text-lg mb-1 ${
                          isUnavailable ? "line-through text-gray-500" : ""
                        }`}>
                          {item.title}
                        </h3>
                        <p className="text-gray-600 mb-1">
                          Size: {item.selectedSize}
                        </p>
                        <p className={`text-lg font-semibold ${
                          isUnavailable ? "text-gray-400" : ""
                        }`}>
                          ${item.price.toFixed(2)}
                        </p>
                        {isUnavailable && (
                          <p className="text-red-600 text-sm font-medium mt-2">
                            ❌ This item is no longer available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Controls Block */}
                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-6">
                      <div className={`flex items-center border border-gray-300 ${
                        isUnavailable ? "opacity-50 pointer-events-none" : ""
                      }`}>
                        <button
                          className="p-2 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                          onClick={() =>
                            handleDecrease(
                              item._id,
                              item.selectedSize,
                              item.quantity,
                              item.isAvailable ?? true
                            )
                          }
                          disabled={isUnavailable}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-1 border-x border-gray-300 text-md min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          className="p-2 hover:bg-gray-50 transition-colors disabled:cursor-not-allowed"
                          onClick={() =>
                            handleIncrease(
                              item._id,
                              item.selectedSize,
                              item.quantity,
                              item.isAvailable ?? true
                            )
                          }
                          disabled={isUnavailable}
                          aria-label="Increase quantity"
                        >
                          <FaPlus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className={`text-lg font-medium whitespace-nowrap ${
                        isUnavailable ? "text-gray-400 line-through" : ""
                      }`}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleRemove(item._id, item.selectedSize)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <FaTrash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Promo Code & Order Notes - Only show if there are available items */}
            {availableItems.length > 0 && (
              <div className="mt-8">
                <PromoAndNotes />
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:flex-[1] lg:max-w-[320px]">
            <div className="border-b border-gray-300 pb-3 mb-6">
              <h2 className="text-[1.5rem] font-semibold">Order Summary</h2>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
              <div className="relative">
                {/* Spinner Overlay for loadingSummary */}
                {loadingSummary && (
                  <div className="absolute inset-0 bg-white bg-opacity-60 z-10 flex items-center justify-center rounded-lg">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500"></div>
                  </div>
                )}

                <div
                  className={`${
                    loadingSummary ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {/* Show warning if there are unavailable items */}
                  {unavailableCount > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs">
                      <p className="text-yellow-800 font-medium">
                        ⚠️ {unavailableCount} unavailable {unavailableCount === 1 ? 'item' : 'items'} not included in total
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {/* Subtotal */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Promo Discount */}
                    {promoCode && discountAmount > 0 && availableItems.length > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo ({promoCode})</span>
                        <span className="font-semibold">
                          -${discountAmount.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Shipping */}
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-sm">Calculated at checkout</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 pt-4 mb-6">
                    <div className="flex justify-between text-2xl font-semibold">
                      <span>Total</span>
                      <span>${finalTotal.toFixed(2)}</span>
                    </div>
                    {discountAmount > 0 && availableItems.length > 0 && (
                      <p className="text-green-600 text-sm mt-1">
                        You saved ${discountAmount.toFixed(2)}!
                      </p>
                    )}
                  </div>

                  {/* Order Note Preview */}
                  {orderNote && availableItems.length > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                      <p className="font-medium text-gray-700 mb-1">
                        📝 Order Note:
                      </p>
                      <p className="text-gray-600 italic">"{orderNote}"</p>
                    </div>
                  )}

                  {/* Checkout Button */}
                  {availableItems.length === 0 ? (
                    // All items unavailable - show "Continue Shopping" button
                    <Link to="/">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded transition-colors font-semibold">
                        Continue Shopping
                      </button>
                    </Link>
                  ) : (
                    // Has available items - show checkout button
                    <button
                      onClick={handleCheckout}
                      disabled={validating || availableItems.length === 0}
                      className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {validating ? "Checking..." : "Proceed to Checkout"}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center mt-4 text-gray-600 text-sm">
                <FaLock className="w-4 h-4 mr-2" />
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center text-gray-500 py-24">
          <p className="mb-2 text-xl">Your cart is empty.</p>
          <MdOutlineRemoveShoppingCart className="text-6xl my-4" />
          <Link to="/" className="mt-4 text-blue-600 hover:underline text-lg">
            Continue Shopping
          </Link>
        </div>
      )}
    </div>
  );
};

export default Cart;