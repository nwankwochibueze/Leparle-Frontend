// client/src/types/order.ts

export interface OrderItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  selectedSize: string;
  imageUrl: string;
}

export interface ShippingInfo {
  fullName: string;
  email: string;
  address: string;
  city: string;
  phone: string;
}

export interface PaymentInfo {
  reference: string;
  status: string;
  amount: number;
  method: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  _id: string;
  userId?: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  paymentInfo: PaymentInfo;
  totalAmount: number;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

// For API responses
export interface OrderWithUser extends Order {
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
