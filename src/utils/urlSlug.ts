// src/utils/urlSlug.ts

/**
 * Convert product name to URL-friendly slug
 * Example: "Red Leather Handbag" -> "red-leather-handbag"
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '');  // Remove leading/trailing hyphens
};

/**
 * Extract product ID from slug
 * Example: "red-leather-handbag-507f1f77bcf86cd799439011" -> "507f1f77bcf86cd799439011"
 */
export const extractIdFromSlug = (slug: string): string => {
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Check if last part looks like a MongoDB ObjectId (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(lastPart)) {
    return lastPart;
  }
  
  // If not, try to find "featured-" prefix (for featured products)
  if (slug.startsWith('featured-')) {
    return slug;
  }
  
  // Otherwise return the whole slug (fallback)
  return slug;
};

/**
 * Create full slug with product name and ID
 * Example: "Red Handbag", "507f1f77bcf86cd799439011" -> "red-handbag-507f1f77bcf86cd799439011"
 */
export const createProductSlug = (name: string, id: string): string => {
  const nameSlug = createSlug(name);
  return `${nameSlug}-${id}`;
};