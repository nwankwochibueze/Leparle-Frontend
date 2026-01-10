import type { Product } from "../types/product";

export function getRecommendations(
  allProducts: Product[],
  shownProductIds: string[],
  options?: {
    sameCategory?: boolean;
    onSaleOnly?: boolean;
    limit?: number;
  }
) {
  const shownIds = new Set(shownProductIds);

  // Start with all products, then filter out the ones currently shown
  let pool = allProducts.filter((p) => !shownIds.has(p.id));

  // If onSaleOnly is true, filter the pool to only include sale items
  if (options?.onSaleOnly) {
    pool = pool.filter((p) => p.onSale);
  }

  // If sameCategory is true, filter the pool to match the category of the first shown product
  if (options?.sameCategory && shownProductIds.length > 0) {
    const firstShownProduct = allProducts.find((p) =>
      shownProductIds.includes(p.id)
    );
    if (firstShownProduct) {
      pool = pool.filter((p) => p.category === firstShownProduct.category);
    }
  }

  // Shuffle the pool for randomness
  pool = pool.sort(() => 0.5 - Math.random());

  // Return a slice of the pool up to the desired limit
  return pool.slice(0, options?.limit ?? 4);
}