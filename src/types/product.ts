// src/types/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  description?: string;
  images: string[];
  category: string; // Remove the optional ?
  stock?: number;
  featured?: boolean;
  onSale?: boolean;
  colors: string[]; // Remove the optional ?
  sizes: string[]; // Remove the optional ?
  createdAt?: string;
  updatedAt?: string;
}