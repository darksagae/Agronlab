/**
 * Listing images: compress on-device, upload bytes to S3 only, return keys for DynamoDB.
 * Never put raw image bytes in DynamoDB or GraphQL — store `imageKeysJson` (string[]) only.
 *
 * Videos / large PDFs: same idea — upload to S3 under `store/listings/...`, store key only;
 * use multipart-friendly sizes; avoid loading full video into memory on weak devices.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { uploadData } from 'aws-amplify/storage';

/** Default caps for marketplace photos (Uganda-friendly: smaller payloads, faster loads). */
export const LISTING_IMAGE_DEFAULTS = {
  maxWidth: 1600,
  compress: 0.78,
};

/** Thumbnail / grid tiles — extra savings when showing many rows. */
export const LISTING_THUMB_DEFAULTS = {
  maxWidth: 800,
  compress: 0.72,
};

/**
 * Resize (max width) + JPEG compress. Always run before upload.
 * @param {string} localUri - file:// from picker or camera
 * @param {{ maxWidth?: number, compress?: number }} [opts]
 * @returns {Promise<string>} new file:// uri
 */
export async function compressListingImageAsync(localUri, opts = {}) {
  const maxWidth = opts.maxWidth ?? LISTING_IMAGE_DEFAULTS.maxWidth;
  const compress = opts.compress ?? LISTING_IMAGE_DEFAULTS.compress;

  const result = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: maxWidth } }],
    {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}

function makeObjectName() {
  const id =
    global.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  return `listing-${id}.jpg`;
}

/**
 * Compress, then upload to S3. Returns the object key to persist in DynamoDB (e.g. StoreListing.imageKeysJson).
 * @param {string} localUri
 * @param {{ maxWidth?: number, compress?: number }} [compressOpts]
 * @returns {Promise<{ key: string }>}
 */
export async function uploadListingPhotoAsync(localUri, compressOpts = {}) {
  const compressedUri = await compressListingImageAsync(localUri, compressOpts);
  const response = await fetch(compressedUri);
  const blob = await response.blob();

  const name = makeObjectName();
  const path = `store/listings/${name}`;

  const task = uploadData({
    path,
    data: blob,
    options: {
      contentType: 'image/jpeg',
    },
  });

  await task.result;
  return { key: path };
}
