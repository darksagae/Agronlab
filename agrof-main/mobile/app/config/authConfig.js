/**
 * Auth: Amazon Cognito via Amplify (Gen 2 `amplify_outputs.json`).
 * Optional overrides: EXPO_PUBLIC_COGNITO_* when not using amplify_outputs.
 */

import amplifyOutputsJson from '../amplify_outputs.json';

/** Same unwrap as amplifyConfig — Metro may nest JSON under `default`. */
const amplifyOutputs = amplifyOutputsJson?.default ?? amplifyOutputsJson;

const hasAmplifyAuth = Boolean(
  amplifyOutputs?.auth?.user_pool_id && amplifyOutputs?.auth?.user_pool_client_id
);

export const AUTH_PROVIDER = 'cognito';

export const cognitoConfig = {
  region:
    process.env.EXPO_PUBLIC_COGNITO_REGION ||
    amplifyOutputs?.auth?.aws_region ||
    amplifyOutputs?.storage?.aws_region ||
    '',
  userPoolId:
    process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID ||
    amplifyOutputs?.auth?.user_pool_id ||
    '',
  clientId:
    process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID ||
    amplifyOutputs?.auth?.user_pool_client_id ||
    '',
};

export function isCognitoConfigured() {
  if (hasAmplifyAuth) return true;
  return Boolean(
    cognitoConfig.userPoolId &&
      cognitoConfig.clientId &&
      /^[\w-]+_[0-9a-zA-Z]+$/.test(cognitoConfig.userPoolId)
  );
}

/** Cognito + Amplify when configured (default once amplify_outputs has auth) */
export function isCognitoAuth() {
  return AUTH_PROVIDER === 'cognito' && isCognitoConfigured();
}

export function getEmailVerificationMode() {
  return isCognitoAuth() ? 'code' : 'link';
}
