import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'agrofUploads',
  access: (allow) => ({
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
