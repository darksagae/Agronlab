/**
 * Amazon Cognito User Pools — sign-up, email code confirmation, sign-in.
 * Configure via config/authConfig.js (EXPO_PUBLIC_* env vars).
 */

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { cognitoConfig, isCognitoConfigured } from '../config/authConfig';

let userPool = null;

function getPool() {
  if (!isCognitoConfigured()) {
    return null;
  }
  if (!userPool) {
    userPool = new CognitoUserPool({
      UserPoolId: cognitoConfig.userPoolId,
      ClientId: cognitoConfig.clientId,
    });
  }
  return userPool;
}

function buildCognitoUser(email) {
  const pool = getPool();
  if (!pool) return null;
  return new CognitoUser({
    Username: email.trim().toLowerCase(),
    Pool: pool,
  });
}

/** Normalize phone to E.164 if possible; omit attribute if invalid */
function phoneAttributes(phone) {
  const raw = (phone || '').replace(/\s/g, '');
  if (!raw) return [];
  let e164 = raw;
  if (/^\d{9,12}$/.test(raw)) {
    e164 = `+256${raw.replace(/^0+/, '')}`;
  }
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) {
    return [];
  }
  return [new CognitoUserAttribute({ Name: 'phone_number', Value: e164 })];
}

export async function signUp(email, password, { fullName = '', phone = '' } = {}) {
  const pool = getPool();
  if (!pool) {
    throw new Error('Cognito User Pool is not configured. Set EXPO_PUBLIC_COGNITO_* env vars.');
  }
  // Username is the email; do not duplicate `email` in attributes when email is the sign-in username.
  const attributeList = [
    new CognitoUserAttribute({ Name: 'name', Value: fullName || email.split('@')[0] }),
    ...phoneAttributes(phone),
  ];

  return new Promise((resolve, reject) => {
    pool.signUp(
      email.trim().toLowerCase(),
      password,
      attributeList,
      null,
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({
          userSub: result.userSub,
          userConfirmed: result.userConfirmed,
        });
      }
    );
  });
}

export async function confirmSignUp(email, code) {
  const cognitoUser = buildCognitoUser(email);
  if (!cognitoUser) {
    throw new Error('Cognito is not configured');
  }
  const trimmed = (code || '').replace(/\s/g, '');
  return new Promise((resolve, reject) => {
    cognitoUser.confirmRegistration(trimmed, true, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export async function resendConfirmationCode(email) {
  const cognitoUser = buildCognitoUser(email);
  if (!cognitoUser) {
    throw new Error('Cognito is not configured');
  }
  return new Promise((resolve, reject) => {
    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function sessionToUser(session) {
  const idToken = session.getIdToken();
  const payload = idToken.decodePayload();
  const sub = payload.sub;
  const email = payload.email || payload['cognito:username'] || '';
  const emailVerified =
    payload.email_verified === true ||
    payload.email_verified === 'true' ||
    payload.email_verified === 'True';

  return {
    uid: sub,
    email,
    emailVerified,
    displayName: payload.name || email.split('@')[0],
    cognito: true,
    getIdToken: () => session.getIdToken().getJwtToken(),
  };
}

export async function signIn(email, password) {
  const cognitoUser = buildCognitoUser(email);
  if (!cognitoUser) {
    throw new Error('Cognito is not configured');
  }
  const authDetails = new AuthenticationDetails({
    Username: email.trim().toLowerCase(),
    Password: password,
  });

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session) {
        try {
          resolve({ session, user: sessionToUser(session) });
        } catch (e) {
          reject(e);
        }
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export async function forgotPassword(email) {
  const cognitoUser = buildCognitoUser(email);
  if (!cognitoUser) {
    throw new Error('Cognito is not configured');
  }
  return new Promise((resolve, reject) => {
    cognitoUser.forgotPassword({
      onSuccess: (data) => resolve(data),
      onFailure: (err) => reject(err),
    });
  });
}

export async function signOut() {
  const pool = getPool();
  if (!pool) return;
  const cognitoUser = pool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
}

/**
 * Restore session from pool storage (in-memory on RN unless you add persistent Storage).
 */
export async function getCurrentAuthenticatedUser() {
  const pool = getPool();
  if (!pool) return null;

  return new Promise((resolve) => {
    const cognitoUser = pool.getCurrentUser();
    if (!cognitoUser) {
      resolve(null);
      return;
    }
    cognitoUser.getSession((err, session) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }
      try {
        resolve(sessionToUser(session));
      } catch {
        resolve(null);
      }
    });
  });
}

export function cognitoErrorMessage(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  if (err.code && err.message) return `${err.code}: ${err.message}`;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
