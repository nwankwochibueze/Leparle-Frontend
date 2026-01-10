// src/types/homepage.ts

// ============================================
// CORE DATA TYPES
// ============================================

export interface HeroImage {
  src: string;
  altText?: string;
}

export interface ColorVariant {
  color: string; // e.g., "Black", "Blue", "Brown", "Green"
  colorCode: string; // Hex code for swatch display, e.g., "#000000"
  images: string[]; // Array of images for this color
  altText?: string;
}

export interface ProductImage {
  id: string;
  images: string[]; // Multiple images per product (main/default)
  altText?: string;
  name: string;
  price: number;
  description?: string;
  stock?: number;
  category?: string;
  colorVariants?: ColorVariant[]; // Color variants for the product
}

export interface HeroBlock {
  id: string;
  headline: string;
  subtext?: string;
  heroImage?: HeroImage[];
  productImages?: ProductImage[];
}

// Alternative name (if you prefer "Homepage" instead of "HeroBlock")
export interface Homepage {
  id: string;
  headline: string;
  subtext?: string;
  heroImage: HeroImage[];
  productImages?: ProductImage[];
}

// ============================================
// FORM INPUT TYPES (for React Admin)
// ============================================

export interface ProductImageInput extends Partial<ProductImage> {
  rawFile?: File;
}

export interface HeroImageInput extends Partial<HeroImage> {
  rawFile?: File;
  title?: string;
}

export interface ColorVariantInput extends Partial<ColorVariant> {
  rawFiles?: File[]; // For uploading multiple images for a color variant
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface HomepageResponse {
  data: Homepage[];
  total: number;
}

export interface SingleHomepageResponse {
  id: string;
  headline: string;
  subtext?: string;
  heroImage: HeroImage[];
  productImages?: ProductImage[];
}

// ============================================
// UTILITY TYPES
// ============================================

// For creating new homepage entries
export interface CreateHomepagePayload {
  headline: string;
  subtext?: string;
  heroImage: HeroImage[];
  productImages?: ProductImage[];
}

// For updating existing homepage entries
export interface UpdateHomepagePayload extends Partial<CreateHomepagePayload> {
  id: string;
}