// src/store/type.ts
export interface CartProduct {
  _id: string;
  title: string;
  price: number;
  imageUrl: string;
  selectedSize: string;
  quantity: number;
}

export interface CartState {
  items: CartProduct[];
  totalQuantity: number;
  totalPrice: number;
  promoCode?: string;
  discount: number;
  orderNote?: string;
}
