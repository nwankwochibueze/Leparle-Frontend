// client/src/pages/checkout/Checkout.tsx - FINAL OPTIMIZED VERSION
import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store/store";
import { clearCart, removeFromCart } from "../../store/CartSlice";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../../hooks/useAuth";
import { CartProduct } from "../../store/type";
import { axiosInstance, PAYSTACK_CONFIG } from "../../config/api";

interface PaystackResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  message: string;
  trxref: string;
}

interface PaystackHandler {
  openIframe: () => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        callback: (response: PaystackResponse) => void;
        onClose: () => void;
      }) => PaystackHandler;
    };
  }
}

interface CartItemWithValidation extends CartProduct {
  isAvailable?: boolean;
}

interface CachedValidation {
  validated: CartItemWithValidation[];
  unavailableCount: number;
  timestamp: number;
}

// IDEMPOTENCY MANAGER CLASS

class IdempotencyManager {
  private pendingRequests: Map<string, Promise<unknown>> = new Map();
  private completedRequests: Map<string, unknown> = new Map();
  private readonly ttl = 300000; // 5 minutes

  generateKey(data: Record<string, unknown>): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const dataHash = this.hashData(data);
    return `${dataHash}-${timestamp}-${randomStr}`;
  }

  private hashData(data: Record<string, unknown>): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async executeOnce<T>(key: string, asyncFunction: () => Promise<T>): Promise<T> {
    if (this.completedRequests.has(key)) {
      console.log('🔄 Returning cached result for:', key);
      return this.completedRequests.get(key) as T;
    }

    if (this.pendingRequests.has(key)) {
      console.log('⏳ Request already in progress, waiting for:', key);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = asyncFunction()
      .then(result => {
        this.completedRequests.set(key, result);
        this.pendingRequests.delete(key);
        
        setTimeout(() => {
          this.completedRequests.delete(key);
        }, this.ttl);
        
        return result;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(key: string) {
    this.pendingRequests.delete(key);
    this.completedRequests.delete(key);
  }
}

// DEBOUNCE UTILITY

function debounce(
  func: (name: string, value: string) => void,
  wait: number
): (name: string, value: string) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function executedFunction(name: string, value: string) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(name, value), wait);
  };
}

// MAIN CHECKOUT COMPONENT

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, discount, promoCode } = useSelector(
    (state: RootState) => state.cart
  );

  const { isAuthenticated, user, createAuthAxios } = useUserAuth();

  // ✅ Refs to prevent race conditions
  const callbackExecutedRef = useRef(false);
  const isProcessingRef = useRef(false);
  const idempotencyManagerRef = useRef(new IdempotencyManager());
  const currentIdempotencyKeyRef = useRef<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paystackReady, setPaystackReady] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // ✅ Cart validation state
  const [validatingCart, setValidatingCart] = useState(false);
  const [validatedItems, setValidatedItems] = useState<CartItemWithValidation[]>([]);
  const [unavailableCount, setUnavailableCount] = useState(0);

  /**
   * ✅ OPTIMIZED: Load cached validation from sessionStorage first
   * Only re-validate if cache is missing or stale (>5 minutes old)
   */
  const validateCartItems = useCallback(async () => {
    if (items.length === 0) return;

    // Check for cached validation from Cart page
    const cachedData = sessionStorage.getItem('cart_validation');
    
    if (cachedData) {
      try {
        const parsed: CachedValidation = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
        
        // Use cached data if it's less than 5 minutes old
        if (cacheAge < CACHE_TTL) {
          console.log('✅ Using cached validation from Cart page');
          setValidatedItems(parsed.validated);
          setUnavailableCount(parsed.unavailableCount);
          setValidatingCart(false);
          return;
        } else {
          console.log('⏰ Cached validation expired, re-validating...');
        }
      } catch (error) {
        console.error('❌ Error parsing cached validation:', error);
      }
    }

    // If no cache or cache expired, validate items
    setValidatingCart(true);
    const validated: CartItemWithValidation[] = [];
    let unavailableCounter = 0;

    console.log("🔍 Validating cart items at checkout...");

    for (const item of items) {
      // Skip featured products
      if (item._id.startsWith("featured-")) {
        validated.push({ ...item, isAvailable: true });
        continue;
      }

      try {
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
        console.error(`❌ Error validating ${item.title}:`, error);
        validated.push({ ...item, isAvailable: false });
        unavailableCounter++;
      }
    }

    setValidatedItems(validated);
    setUnavailableCount(unavailableCounter);
    setValidatingCart(false);

    // Update cache
    sessionStorage.setItem('cart_validation', JSON.stringify({
      validated,
      unavailableCount: unavailableCounter,
      timestamp: Date.now()
    }));

    console.log(`✅ Validation complete: ${unavailableCounter} unavailable items`);
  }, [items]);

  useEffect(() => {
    validateCartItems();
  }, [items.length, validateCartItems]);

  // Calculate totals only for available items
  const availableItems = validatedItems.filter(item => item.isAvailable);
  const availableSubtotal = availableItems.reduce(
    (sum, item) => sum + (item.price * item.quantity), 
    0
  );
  const finalTotalUSD = availableSubtotal - (discount || 0);
  const totalInNGN = Math.round(finalTotalUSD * PAYSTACK_CONFIG.exchangeRate);
  const amountInKobo = totalInNGN * 100;

  // ✅ Pre-fill form when user data is available
  useEffect(() => {
    if (isAuthenticated && user && user.email) {
      console.log("Autofilling form for user:", user.email);
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        fullName:
          user.name ||
          `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          prev.fullName,
      }));
    }
  }, [isAuthenticated, user]);

  // ✅ Check Paystack availability silently - only show error if it fails
  useEffect(() => {
    let mounted = true;
    
    const checkPaystack = setInterval(() => {
      if (
        window.PaystackPop &&
        typeof window.PaystackPop.setup === "function"
      ) {
        if (mounted) {
          setPaystackReady(true);
          console.log('✅ Paystack loaded successfully');
        }
        clearInterval(checkPaystack);
      }
    }, 100);

    // ✅ Only show error after 10 seconds if Paystack still hasn't loaded
    const timeout = setTimeout(() => {
      clearInterval(checkPaystack);
      if (mounted && !paystackReady) {
        console.error('❌ Paystack failed to load');
        setError("Payment service failed to load. Please refresh the page.");
      }
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(checkPaystack);
      clearTimeout(timeout);
    };
  }, [paystackReady]);

  // ✅ Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [items, navigate]);

  // ✅ Warn user if they try to leave during processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessingRef.current) {
        e.preventDefault();
        e.returnValue = 'Payment is being processed. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ✅ Real-time field validation
  const validateFieldImmediate = (name: string, value: string) => {
    const errors: Record<string, string> = {};

    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email address';
        }
        break;
      case 'phone':
        if (value && !/^[\d\s\-+()]{10,}$/.test(value)) {
          errors.phone = 'Please enter a valid phone number';
        }
        break;
      case 'fullName':
        if (value && value.trim().length < 2) {
          errors.fullName = 'Name must be at least 2 characters';
        }
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: errors[name] || ''
    }));
  };

  const debouncedValidateField = debounce(validateFieldImmediate, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    debouncedValidateField(name, value);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      errors.fullName = 'Please enter your full name';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError("Please fix the form errors before proceeding.");
      return false;
    }

    return true;
  };

  // ✅ Save order with idempotency - only save available items
  const saveOrder = useCallback(
    async (reference: string, status: string, retries = 3): Promise<{ order?: { _id: string } }> => {
      const orderData = {
        items: availableItems.map((item) => ({
          _id: item._id,
          title: item.title,
          price: Number(item.price),
          imageUrl: item.imageUrl,
          selectedSize: item.selectedSize,
          quantity: Number(item.quantity),
        })),
        shippingInfo: {
          fullName: formData.fullName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
        },
        paymentInfo: {
          reference: reference,
          status: status,
          amount: totalInNGN,
          method: "Paystack",
        },
        totalAmount: finalTotalUSD,
        promoCode: promoCode || undefined,
        discount: discount || 0,
      };

      const idempotencyKey = currentIdempotencyKeyRef.current || 
        idempotencyManagerRef.current.generateKey(orderData);
      
      console.log('🔑 Generated Idempotency Key:', idempotencyKey);
      
      currentIdempotencyKeyRef.current = idempotencyKey;
      sessionStorage.setItem('checkout_idempotency_key', idempotencyKey);

      return idempotencyManagerRef.current.executeOnce(
        idempotencyKey,
        async () => {
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              const requestClient = isAuthenticated 
                ? createAuthAxios() 
                : axiosInstance;

              const endpoint = isAuthenticated ? "/orders" : "/orders/guest";
              
              const headers: Record<string, string> = {
                'X-Request-ID': `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                'Idempotency-Key': idempotencyKey,
              };
              
              console.log('📤 Sending request to:', endpoint);
              
              const res = await requestClient.post(endpoint, orderData, { headers });

              console.log('✅ Order created successfully:', res.data);
              
              sessionStorage.removeItem('checkout_idempotency_key');
              sessionStorage.removeItem('cart_validation');
              return res.data;

            } catch (err) {
              lastError = err as Error;
              
              const axiosError = err as { response?: { status?: number; data?: unknown } };
              console.error('❌ Order save attempt failed:', {
                attempt: attempt + 1,
                status: axiosError.response?.status,
                errorData: axiosError.response?.data,
              });

              if (axiosError.response?.status === 401 && isAuthenticated) {
                throw new Error(
                  "Your session expired. Please log in to save this order to your account. Your payment was successful (ref: " +
                    reference +
                    "). Contact support if needed."
                );
              }
              
              if (axiosError.response?.status && axiosError.response.status >= 400 && axiosError.response.status < 500) {
                if (axiosError.response.status !== 429) {
                  throw err;
                }
              }

              if (attempt < retries - 1) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
                console.log(`🔄 Retry attempt ${attempt + 1} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }

          throw lastError || new Error("Failed to save order after retries");
        }
      );
    },
    [
      formData,
      availableItems,
      totalInNGN,
      finalTotalUSD,
      promoCode,
      discount,
      isAuthenticated,
      createAuthAxios,
    ]
  );

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isProcessingRef.current || loading) {
      console.log('🚫 Payment already in progress, ignoring submission');
      return;
    }

    if (!validateForm()) return;

    if (!paystackReady) {
      setError("Payment service is not ready. Please wait or refresh the page.");
      return;
    }

    if (availableItems.length === 0) {
      setError("Cannot proceed to checkout. All items in your cart are unavailable.");
      return;
    }

    isProcessingRef.current = true;
    setLoading(true);
    setError(null);
    callbackExecutedRef.current = false;

    const reference = `REF_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    console.log('💳 Initiating payment with reference:', reference);

    try {
      const paymentConfig = {
        key: PAYSTACK_CONFIG.publicKey,
        email: formData.email,
        amount: amountInKobo,
        currency: "NGN",
        ref: reference,
        channels: ["card"],
        metadata: {
          custom_fields: [
            {
              display_name: "Customer Name",
              variable_name: "customer_name",
              value: formData.fullName,
            },
            {
              display_name: "Phone",
              variable_name: "phone",
              value: formData.phone || "N/A",
            },
            {
              display_name: "Promo Code",
              variable_name: "promo_code",
              value: promoCode || "None",
            },
            {
              display_name: "Customer Type",
              variable_name: "customer_type",
              value: isAuthenticated ? "Registered" : "Guest",
            },
          ],
        },
        callback: function (response: PaystackResponse) {
          if (callbackExecutedRef.current) {
            console.log('🚫 Callback already executed, ignoring');
            return;
          }
          callbackExecutedRef.current = true;

          console.log("✅ Payment success:", response);

          saveOrder(reference, "success")
            .then((orderResponse) => {
              dispatch(clearCart());
              
              isProcessingRef.current = false;
              currentIdempotencyKeyRef.current = null;
              
              setTimeout(() => {
                navigate("/order-success", {
                  state: {
                    reference,
                    amountUSD: finalTotalUSD,
                    amountNGN: totalInNGN,
                    orderId: orderResponse.order?._id,
                    email: formData.email,
                    isGuest: !isAuthenticated,
                  },
                  replace: true,
                });
              }, 100);
            })
            .catch((err) => {
              console.error("❌ Order save failed:", err);
              const errorMessage =
                err instanceof Error ? err.message : "Unknown error";
              
              setError(errorMessage);
              setLoading(false);
              isProcessingRef.current = false;

              if (errorMessage.includes("session expired")) {
                setShowAuthPrompt(true);
              }
            });
        },
        onClose: function () {
          if (!callbackExecutedRef.current) {
            console.log('❌ Payment cancelled by user');
            setLoading(false);
            isProcessingRef.current = false;
            currentIdempotencyKeyRef.current = null;
            setError("Payment was cancelled. Please try again.");
          }
        },
      };

      const handler = window.PaystackPop.setup(paymentConfig);
      handler.openIframe();
    } catch (err) {
      console.error("Payment error:", err);
      const message = err instanceof Error ? err.message : "Payment failed.";
      setError(message);
      setLoading(false);
      isProcessingRef.current = false;
      currentIdempotencyKeyRef.current = null;
    }
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

  if (items.length === 0) return null;

  const hasOnlyUnavailableItems = unavailableCount === validatedItems.length && validatedItems.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>

        {/* User status banner */}
        <div className="mb-6">
          {isAuthenticated ? (
            <div className="flex items-center bg-green-50 border border-green-200 rounded-lg p-3">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-green-700">
                Logged in as <strong>{user?.email}</strong> - Your order will be
                saved to your account
              </span>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800">
                <strong>Guest Checkout</strong> - You can complete your purchase
                without an account.{" "}
                <a href="/login" className="underline hover:text-blue-900">
                  Log in
                </a>{" "}
                or{" "}
                <a href="/signup" className="underline hover:text-blue-900">
                  create an account
                </a>{" "}
                to track your orders and save your details.
              </p>
            </div>
          )}
        </div>

        {/* ✅ ONLY show validation spinner if actually validating (not using cache) */}
        {validatingCart && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-600 mr-3"></div>
              <p className="text-blue-800">🔍 Checking item availability...</p>
            </div>
          </div>
        )}

        {/* Unavailable Items Alert */}
        {!validatingCart && unavailableCount > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-yellow-800 font-semibold mb-2">
                  ⚠️ {unavailableCount} {unavailableCount === 1 ? 'item is' : 'items are'} no longer available
                </p>
                <p className="text-yellow-700 text-sm mb-3">
                  {hasOnlyUnavailableItems 
                    ? "All items in your cart are currently unavailable. Please return to cart and explore our collection to find similar products."
                    : "Some items in your cart are no longer available. These items will not be included in your order. You can proceed with the available items or return to cart to review."}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/cart")}
                    className="text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
                  >
                    ← Review Cart
                  </button>
                  {!hasOnlyUnavailableItems && (
                    <button
                      onClick={handleRemoveUnavailable}
                      className="text-sm bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                    >
                      Remove Unavailable Items
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 mb-4 rounded bg-red-100 border border-red-300 text-red-800">
            <p className="font-medium mb-1">⚠️ Error</p>
            <p className="text-sm whitespace-pre-line mb-3">{error}</p>
            
            {showAuthPrompt && (
              <button
                onClick={() => navigate("/login", { state: { from: "/checkout" } })}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Go to Login
              </button>
            )}
          </div>
        )}

        {/* ✅ REMOVED: "Loading payment service..." banner - it loads silently now */}

        <div className="grid md:grid-cols-2 gap-8">
          <form
            onSubmit={handlePayment}
            className="bg-white p-6 rounded-lg shadow space-y-4"
          >
            <h2 className="text-xl font-semibold mb-4">Shipping Info</h2>

            <div>
              <input
                type="text"
                name="fullName"
                placeholder="Full Name *"
                required
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.fullName ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.fullName}</p>
              )}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Email *"
                required
                value={formData.email}
                onChange={handleInputChange}
                readOnly={isAuthenticated}
                className={`w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.email ? 'border-red-500' : ''
                } ${isAuthenticated ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full border p-3 rounded focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.phone ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.phone && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
              )}
            </div>

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full border p-3 rounded focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              disabled={
                loading || 
                !paystackReady || 
                isProcessingRef.current || 
                validatingCart || 
                hasOnlyUnavailableItems ||
                availableItems.length === 0
              }
              className="w-full bg-gray-900 text-white py-3 rounded hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed relative"
            >
              {loading ? (
                <>
                  <span>Processing...</span>
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                </>
              ) : validatingCart ? (
                "Validating Cart..."
              ) : hasOnlyUnavailableItems || availableItems.length === 0 ? (
                "No Available Items"
              ) : (
                "Pay with Paystack"
              )}
            </button>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <p className="font-medium mb-1">💳 Payment Methods:</p>
              <p className="text-xs">
                {PAYSTACK_CONFIG.isTestMode
                  ? "Test Mode: Only card payments available for testing"
                  : "Card, Bank Transfer, USSD available"}
              </p>
            </div>
          </form>

          {/* Order Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            {unavailableCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs">
                <p className="text-yellow-800 font-medium">
                  ⚠️ {unavailableCount} unavailable {unavailableCount === 1 ? 'item' : 'items'} not shown
                </p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {validatedItems.map((item) => {
                const isUnavailable = item.isAvailable === false;
                
                if (isUnavailable) {
                  return (
                    <div
                      key={`${item._id}-${item.selectedSize}`}
                      className="flex justify-between opacity-40 relative"
                    >
                      <span className="text-gray-500 line-through pr-12">
                        {item.title} ({item.selectedSize}) × {item.quantity}
                      </span>
                      <div className="absolute right-0 top-0 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded">
                        UNAVAILABLE
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div
                    key={`${item._id}-${item.selectedSize}`}
                    className="flex justify-between"
                  >
                    <span className="text-gray-700">
                      {item.title} ({item.selectedSize}) × {item.quantity}
                    </span>
                    <span className="font-semibold">
                      ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span>${availableSubtotal.toFixed(2)}</span>
              </div>

              {promoCode && discount > 0 && availableItems.length > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({promoCode}):</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-800 text-lg font-semibold border-t pt-2">
                <span>Total (USD):</span>
                <span>${finalTotalUSD.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-800 text-lg font-semibold">
                <span>Total (NGN):</span>
                <span>₦{totalInNGN.toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                Exchange Rate: $1 = ₦{PAYSTACK_CONFIG.exchangeRate.toLocaleString()}
              </p>

              {discount > 0 && availableItems.length > 0 && (
                <p className="text-green-600 text-sm text-center font-medium">
                  You saved ${discount.toFixed(2)}! 🎉
                </p>
              )}
            </div>

            <div className="mt-6 text-center text-gray-600 text-sm">
              🔒 Secure payment powered by Paystack
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Checkout;