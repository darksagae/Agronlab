/**
 * Create marketplace listings: images go to S3; DynamoDB stores only keys + metadata.
 */

import { uploadListingPhotoAsync, LISTING_THUMB_DEFAULTS } from './listingMediaService';
import { getAmplifyDataClient, isAmplifyDataConfigured } from '../lib/data/amplifyDataClient';

/**
 * @param {object} input
 * @param {string} input.title
 * @param {string} [input.description]
 * @param {string} [input.priceLabel]
 * @param {string} [input.sellerSub] - Cognito `sub` (optional display / filter)
 * @param {string[]} input.localImageUris - file:// from ImagePicker, compressed + uploaded in order
 * @param {{ thumb?: boolean }} [input.uploadOptions] - if thumb: stronger compression for uploads
 */
export async function createStoreListing({
  title,
  description = '',
  priceLabel = '',
  sellerSub = '',
  localImageUris = [],
  uploadOptions = {},
}) {
  if (!title?.trim()) {
    throw new Error('Title is required');
  }
  if (!isAmplifyDataConfigured()) {
    throw new Error('Amplify Data is not configured. Deploy sandbox and copy amplify_outputs.json.');
  }

  const client = getAmplifyDataClient();
  if (!client?.models?.StoreListing) {
    throw new Error('StoreListing model missing — deploy latest backend.');
  }

  const compressOpts = uploadOptions.thumb ? LISTING_THUMB_DEFAULTS : {};

  const keys = [];
  for (const uri of localImageUris) {
    const { key } = await uploadListingPhotoAsync(uri, compressOpts);
    keys.push(key);
  }

  const { data, errors } = await client.models.StoreListing.create({
    title: title.trim(),
    description,
    imageKeysJson: JSON.stringify(keys),
    priceLabel,
    sellerSub,
    createdAt: new Date().toISOString(),
  });

  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join(', '));
  }
  return { listing: data, imageKeys: keys };
}
