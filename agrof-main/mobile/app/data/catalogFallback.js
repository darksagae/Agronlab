/**
 * Bundled fallback when S3 catalog is missing or offline (small — full catalog should live in S3).
 */
import { featuredProducts } from './featuredProducts';

export const fallbackCategories = [
  { id: 1, name: 'fertilizers', display_name: 'Fertilizers' },
  { id: 2, name: 'fungicides', display_name: 'Fungicides' },
  { id: 3, name: 'herbicides', display_name: 'Herbicides' },
  { id: 4, name: 'nursery_bed', display_name: 'Nursery Bed' },
  { id: 5, name: 'organic_chemicals', display_name: 'Organic Chemicals' },
  { id: 6, name: 'seeds', display_name: 'Seeds' },
];

/** Same fields StoreScreen / ProductDetail expect */
export function getFallbackCatalog() {
  return {
    version: 0,
    categories: fallbackCategories,
    products: featuredProducts,
  };
}
