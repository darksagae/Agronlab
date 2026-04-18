import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'agrofUploads',
  access: (allow) => ({
    /** Product catalog JSON + images — large payloads live here, not in the app binary. */
    'store/catalog/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    /** Marketplace listing photos: traders upload (auth); everyone can read (incl. guest browse). Never put bytes in DynamoDB — only these keys. */
    'store/listings/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read', 'write', 'delete']),
    ],
    'public/*': [allow.guest.to(['read']), allow.authenticated.to(['read', 'write', 'delete'])],
    'protected/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
    'uploads/{entity_id}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
