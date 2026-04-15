/**
 * Auth provider selection (Firebase vs Amazon Cognito).
 *
 * Cognito + SES: verification codes are emailed; user enters the code in-app.
 * Firebase: link-based email verification (existing behaviour).
 *
 * Set in `.env` or `app.config.js` extra:
 *   EXPO_PUBLIC_AUTH_PROVIDER=cognito
 *   EXPO_PUBLIC_COGNITO_REGION=eu-west-1
 *   EXPO_PUBLIC_COGNITO_USER_POOL_ID=eu-west-1_xxxx
 *   EXPO_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
 */

const provider = (process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'firebase').toLowerCase();

export const AUTH_PROVIDER = provider === 'cognito' ? 'cognito' : 'firebase';

export const cognitoConfig = {
  region: process.env.EXPO_PUBLIC_COGNITO_REGION || '',
  userPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '',
  clientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '',
};

export function isCognitoConfigured() {
  return Boolean(
    cognitoConfig.userPoolId &&
      cognitoConfig.clientId &&
      /^[\w-]+_[0-9a-zA-Z]+$/.test(cognitoConfig.userPoolId)
  );
}

/** Use Cognito (code verification) when provider is cognito and pool/client are set */
export function isCognitoAuth() {
  return AUTH_PROVIDER === 'cognito' && isCognitoConfigured();
}

export function getEmailVerificationMode() {
  return isCognitoAuth() ? 'code' : 'link';
}
