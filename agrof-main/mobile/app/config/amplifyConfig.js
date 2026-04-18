import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Amplify } from 'aws-amplify';
import { parseAmplifyConfig } from 'aws-amplify/utils';
import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import outputsJson from '../amplify_outputs.json';

/**
 * Metro / some bundlers wrap JSON as `{ default: { ... } }`. Gen 2 outputs must include
 * `version` so `parseAmplifyConfig` treats them as Amplify outputs; without it, Auth stays
 * in snake_case and Cognito reports "UserPool not configured".
 */
function unwrapJson(moduleExport) {
  if (!moduleExport || typeof moduleExport !== 'object') return null;
  const inner = moduleExport.default ?? moduleExport;
  return inner && typeof inner === 'object' ? inner : null;
}

function buildOutputsFromEnv() {
  const user_pool_id = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
  const user_pool_client_id = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
  const identity_pool_id = process.env.EXPO_PUBLIC_COGNITO_IDENTITY_POOL_ID;
  const aws_region =
    process.env.EXPO_PUBLIC_COGNITO_REGION ||
    process.env.EXPO_PUBLIC_AWS_REGION ||
    '';
  if (!user_pool_id || !user_pool_client_id || !aws_region) {
    return null;
  }
  return {
    version: '1',
    auth: {
      user_pool_id,
      aws_region,
      user_pool_client_id,
      identity_pool_id: identity_pool_id || undefined,
      username_attributes: ['email'],
      standard_required_attributes: ['email'],
      user_verification_types: ['email'],
      mfa_methods: [],
      mfa_configuration: 'NONE',
      groups: [],
      unauthenticated_identities_enabled: true,
    },
  };
}

/**
 * Wire Amplify JS v6 to Gen 2 `amplify_outputs.json` (or EXPO_PUBLIC_COGNITO_* env).
 * Runs once on import — import this module before any `aws-amplify/auth` usage.
 */
export function configureAmplify() {
  let raw = unwrapJson(outputsJson);
  if (!raw?.auth?.user_pool_id) {
    raw = buildOutputsFromEnv();
  }

  if (!raw?.auth?.user_pool_id) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Amplify] Not configured: add agrof-main/mobile/app/amplify_outputs.json (from `npm run sandbox` + `npm run amplify:copy-outputs`) or set EXPO_PUBLIC_COGNITO_USER_POOL_ID, EXPO_PUBLIC_COGNITO_CLIENT_ID, EXPO_PUBLIC_COGNITO_REGION.'
      );
    }
    return;
  }

  // Required for isAmplifyOutputs() inside parseAmplifyConfig — without it, Auth is not normalized.
  if (!raw.version) {
    raw = { ...raw, version: '1' };
  }

  try {
    const parsed = parseAmplifyConfig(raw);
    Amplify.configure(parsed);

    // React Native has no localStorage — persist Cognito tokens in AsyncStorage (see aws-amplify/auth peer + RN docs).
    if (Platform.OS !== 'web') {
      cognitoUserPoolsTokenProvider.setKeyValueStorage(AsyncStorage);
      const authCfg = Amplify.getConfig().Auth;
      if (authCfg) {
        cognitoUserPoolsTokenProvider.setAuthConfig(authCfg);
      }
    }

    if (__DEV__) {
      const config = Amplify.getConfig();
      const hasAuth = !!config.Auth?.Cognito?.userPoolId;
      const hasData = !!config.API?.GraphQL?.endpoint;
      const hasStorage = !!config.Storage?.S3?.bucket;

      if (!hasAuth) console.warn('[Amplify] Auth is NOT configured. Check amplify_outputs.json');
      if (!hasData) console.warn('[Amplify] Data (GraphQL) is NOT configured. This will cause generateClient() to fail in services.');
      if (!hasStorage) console.warn('[Amplify] Storage (S3) is NOT configured.');

      if (hasAuth) {
        console.log('[Amplify] Configured successfully:', {
          auth: true,
          data: hasData,
          storage: hasStorage,
          userPoolId: raw.auth?.user_pool_id
        });
      }
    }
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('[Amplify] configure failed:', e?.message || e);
    }
  }
}

configureAmplify();
