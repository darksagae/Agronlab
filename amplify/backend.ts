import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { storage } from './storage/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  storage,
  data,
});

/**
 * USER_PASSWORD_AUTH: sign-in works in Expo Go and without linking @aws-amplify/react-native
 * (SRP uses native computeModPow). USER_SRP_AUTH remains for dev clients that include native code.
 */
backend.auth.resources.cfnResources.cfnUserPoolClient.addPropertyOverride('ExplicitAuthFlows', [
  'ALLOW_USER_PASSWORD_AUTH',
  'ALLOW_USER_SRP_AUTH',
  'ALLOW_REFRESH_TOKEN_AUTH',
]);
