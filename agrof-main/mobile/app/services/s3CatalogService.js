/**
 * Store catalog hosted on S3 (JSON + optional image keys) — keeps the app bundle light.
 * Upload `store/catalog/catalog.json` via AWS Console or a small admin script after deploy.
 */

import { getUrl } from 'aws-amplify/storage';
import outputs from '../amplify_outputs.json';

const CATALOG_PATH = 'store/catalog/catalog.json';

export function isS3CatalogAvailable() {
  return Boolean(outputs?.storage?.bucket_name || outputs?.storage?.buckets?.length);
}

let s3Cache;
let s3CacheAt = 0;
const TTL_MS = 60 * 1000;

/**
 * @returns {Promise<{ version: number, categories: object[], products: object[] } | null>}
 */
export async function fetchCatalogJsonFromS3() {
  if (!isS3CatalogAvailable()) return null;
  if (s3Cache && Date.now() - s3CacheAt < TTL_MS) {
    return s3Cache;
  }
  try {
    const { url } = await getUrl({
      path: CATALOG_PATH,
      options: { expiresIn: 300 },
    });
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !Array.isArray(json.products)) return null;
    s3Cache = {
      version: json.version ?? 1,
      categories: Array.isArray(json.categories) ? json.categories : [],
      products: json.products,
    };
    s3CacheAt = Date.now();
    return s3Cache;
  } catch (e) {
    console.warn('[s3Catalog] catalog.json not available:', e?.message || e);
    return null;
  }
}

export function clearS3CatalogCache() {
  s3Cache = null;
  s3CacheAt = 0;
}

/**
 * Adds `resolvedImageUri` for each product with `imageKey` (S3) so `Image` / OptimizedImage can use `{ uri }`.
 */
export async function enrichProductsWithResolvedImages(products) {
  if (!Array.isArray(products)) return [];
  const out = await Promise.all(
    products.map(async (p) => {
      if (!p?.imageKey) return p;
      try {
        const { url } = await getUrl({
          path: p.imageKey,
          options: { expiresIn: 3600 },
        });
        return { ...p, resolvedImageUri: url.toString() };
      } catch {
        return p;
      }
    })
  );
  return out;
}
