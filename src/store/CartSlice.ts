// src/store/CartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartState, CartProduct } from "./type";

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
    (total, item) => total + item.quantity,
    0
  );

  // ✅ FIX: Ensure prices are numbers, not strings
  state.totalPrice = state.items.reduce((total, item) => {
    const price = Number(item.price);
    const quantity = Number(item.quantity);
    return total + price * quantity;
  }, 0);
};

const initialState: CartState = loadCartFromStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartProduct>) => {
      const newItem = action.payload;

      // ✅ FIX: Ensure price and quantity are numbers
      const itemToAdd = {
        ...newItem,
        price: Number(newItem.price),
        quantity: Number(newItem.quantity),
      };

      const existingItem = state.items.find(
        (item) =>
          item._id === itemToAdd._id &&
          item.selectedSize === itemToAdd.selectedSize
      );

      if (existingItem) {
        existingItem.quantity += itemToAdd.quantity;
      } else {
        state.items.push(itemToAdd);
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
        // ✅ FIX: Ensure quantity is a number
        existingItem.quantity = Number(quantity);
      }

      recalculateTotals(state);
      saveCartToStorage(state);
    },

    // Apply promo code with discount
    applyPromoCode: (
      state,
      action: PayloadAction<{ code: string; discount: number }>
    ) => {
      state.promoCode = action.payload.code;
      state.discount = Number(action.payload.discount);
      saveCartToStorage(state);
    },

    // Remove promo code
    removePromoCode: (state) => {
      state.promoCode = undefined;
      state.discount = 0;
      saveCartToStorage(state);
    },

    // Set order note
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
