import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AxiosError } from "axios";
import authService from "../../services/authService";

export interface CartProduct {
  _id: string;
  title: string;
  imageUrl: string;
  price: number;
  quantity: number;
  selectedSize: string;
}

export interface CartState {
  items: CartProduct[];
  totalQuantity: number;
  totalPrice: number;
  promoCode?: string;
  discount: number;
  orderNote?: string;
}

// Backend cart item format
interface BackendCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
}

const loadCartFromStorage = (): CartState => {
  try {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error("Error loading cart from localStorage:", error);
  }
  return {
    items: [],
    totalQuantity: 0,
    totalPrice: 0,
    promoCode: undefined,
    discount: 0,
    orderNote: undefined,
  };
};

const saveCartToStorage = (state: CartState) => {
  try {
    localStorage.setItem("cart", JSON.stringify(state));
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
  }
};

const recalculateTotals = (state: CartState) => {
  state.totalQuantity = state.items.reduce(
    (total: number, item: CartProduct) => total + item.quantity,
    0
  );
  state.totalPrice = state.items.reduce(
    (total: number, item: CartProduct) => total + item.price * item.quantity,
    0
  );
};

const initialState: CartState = loadCartFromStorage();

// ✅ Sync cart with backend after login
export const syncCartWithBackend = createAsyncThunk<
  CartProduct[],
  void,
  { rejectValue: string; state: { cart: CartState } }
>("cart/sync", async (_, { getState, rejectWithValue }) => {
  try {
    // ✅ USE authService instead of getting token from Redux
    const authAxios = authService.createAuthAxios();

    const state = getState();

    // Convert CartProduct[] to backend format
    const backendCart: BackendCartItem[] = state.cart.items.map(
      (item: CartProduct) => ({
        productId: item._id,
        name: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.imageUrl,
        size: item.selectedSize,
      })
    );

    const response = await authAxios.post<{ cart: BackendCartItem[] }>(
      "/cart/sync",
      { cart: backendCart }
    );

    // Convert backend format back to CartProduct[]
    const syncedCart: CartProduct[] = response.data.cart.map(
      (item: BackendCartItem) => ({
        _id: item.productId,
        title: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.image,
        selectedSize: item.size || "",
      })
    );

    return syncedCart;
  } catch (error: unknown) {
    const err = error as AxiosError<{ error?: string }>;
    return rejectWithValue(err.response?.data?.error || "Failed to sync cart");
  }
});

// ✅ Fetch cart from backend
export const fetchCart = createAsyncThunk<
  CartProduct[],
  void,
  { rejectValue: string }
>("cart/fetch", async (_, { rejectWithValue }) => {
  try {
    // ✅ USE authService instead of getting token from Redux
    const authAxios = authService.createAuthAxios();

    const response = await authAxios.get<{ cart: BackendCartItem[] }>("/cart");

    // Convert backend format to CartProduct[]
    const cartItems: CartProduct[] = response.data.cart.map(
      (item: BackendCartItem) => ({
        _id: item.productId,
        title: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.image,
        selectedSize: item.size || "",
      })
    );

    return cartItems;
  } catch (error: unknown) {
    const err = error as AxiosError<{ error?: string }>;
    return rejectWithValue(err.response?.data?.error || "Failed to fetch cart");
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartProduct>) => {
      const newItem = action.payload;

      const existingItem = state.items.find(
        (item) =>
          item._id === newItem._id && item.selectedSize === newItem.selectedSize
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        state.items.push(newItem);
      }

      recalculateTotals(state);
      saveCartToStorage(state);
    },

    removeFromCart: (
      state,
      action: PayloadAction<{ _id: string; selectedSize: string }>
    ) => {
      const { _id, selectedSize } = action.payload;

      state.items = state.items.filter(
        (item) => !(item._id === _id && item.selectedSize === selectedSize)
      );

      recalculateTotals(state);
      saveCartToStorage(state);
    },

    updateQuantity: (
      state,
      action: PayloadAction<{
        _id: string;
        selectedSize: string;
        quantity: number;
      }>
    ) => {
      const { _id, selectedSize, quantity } = action.payload;
      const existingItem = state.items.find(
        (item) => item._id === _id && item.selectedSize === selectedSize
      );

      if (existingItem) {
        existingItem.quantity = quantity;
      }

      recalculateTotals(state);
      saveCartToStorage(state);
    },

    applyPromoCode: (
      state,
      action: PayloadAction<{ code: string; discount: number }>
    ) => {
      state.promoCode = action.payload.code;
      state.discount = action.payload.discount;
      saveCartToStorage(state);
    },

    removePromoCode: (state) => {
      state.promoCode = undefined;
      state.discount = 0;
      saveCartToStorage(state);
    },

    setOrderNote: (state, action: PayloadAction<string>) => {
      state.orderNote = action.payload;
      saveCartToStorage(state);
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
      state.promoCode = undefined;
      state.discount = 0;
      state.orderNote = undefined;

      saveCartToStorage(state);
    },
  },
  extraReducers: (builder) => {
    // Sync cart
    builder
      .addCase(syncCartWithBackend.fulfilled, (state, action) => {
        state.items = action.payload;
        recalculateTotals(state);
        saveCartToStorage(state);
      })
      .addCase(syncCartWithBackend.rejected, (_state, action) => {
        console.error("Cart sync failed:", action.payload);
      });

    // Fetch cart
    builder
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        recalculateTotals(state);
        saveCartToStorage(state);
      })
      .addCase(fetchCart.rejected, (_state, action) => {
        console.error("Cart fetch failed:", action.payload);
      });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  applyPromoCode,
  removePromoCode,
  setOrderNote,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
