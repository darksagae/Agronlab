/**
 * Amazon Cognito via AWS Amplify v6 (aligned with Gen 2 amplify_outputs.json).
 */

import {
  signUp as amplifySignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  confirmSignUp as amplifyConfirmSignUp,
  resendSignUpCode,
  resetPassword,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';
import { isCognitoConfigured } from '../config/authConfig';

function requireConfigured() {
  if (!isCognitoConfigured()) {
    throw new Error(
      'Cognito is not configured. Deploy Amplify sandbox and ensure amplify_outputs.json is present.'
    );
  }
}

function phoneAttribute(phone) {
  const raw = (phone || '').replace(/\s/g, '');
  if (!raw) return undefined;
  let e164 = raw;
  if (/^\d{9,12}$/.test(raw)) {
    e164 = `+256${raw.replace(/^0+/, '')}`;
  }
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) return undefined;
  return e164;
}

export async function signUp(email, password, { fullName = '', phone = '' } = {}) {
  requireConfigured();
  const normalized = email.trim().toLowerCase();
  const attrs = {
    email: normalized,
  };
  if (fullName) attrs.name = fullName;
  const tel = phoneAttribute(phone);
  if (tel) attrs.phone_number = tel;

  const result = await amplifySignUp({
    username: normalized,
    password,
    options: { userAttributes: attrs },
  });

  return {
    userSub: result.userId,
    userConfirmed: result.isSignUpComplete === true,
  };
}

export async function confirmSignUp(email, code) {
  requireConfigured();
  const normalized = email.trim().toLowerCase();
  const trimmed = (code || '').replace(/\s/g, '');
  await amplifyConfirmSignUp({
    username: normalized,
    confirmationCode: trimmed,
  });
}

export async function resendConfirmationCode(email) {
  requireConfigured();
  await resendSignUpCode({ username: email.trim().toLowerCase() });
}

function mapSessionToUser(payload, amplifyUser) {
  const sub = payload?.sub || amplifyUser?.userId;
  const email =
    payload?.email ||
    payload?.['cognito:username'] ||
    amplifyUser?.signInDetails?.loginId ||
    amplifyUser?.username ||
    '';
  const emailVerified =
    payload?.email_verified === true ||
    payload?.email_verified === 'true' ||
    payload?.email_verified === 'True';

  return {
    uid: sub,
    email,
    emailVerified,
    displayName: payload?.name || (email ? email.split('@')[0] : ''),
    cognito: true,
    getIdToken: async () => {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString?.() ?? null;
    },
  };
}

export async function signIn(email, password) {
  requireConfigured();
  const normalized = email.trim().toLowerCase();

  async function attemptSignIn(authFlowType) {
    const params = { username: normalized, password };
    if (authFlowType) params.options = { authFlowType };
    return amplifySignIn(params);
  }

  // Prefer USER_PASSWORD_AUTH (Expo Go). Falls back to SRP if the client disallows it.
  let result;
  try {
    result = await attemptSignIn('USER_PASSWORD_AUTH');
  } catch (e) {
    const msg = String(e?.message || '');
    if (e?.name === 'UserAlreadyAuthenticatedException') {
      // Stale session — clear it and retry.
      await amplifySignOut();
      result = await attemptSignIn('USER_PASSWORD_AUTH');
    } else if (
      e?.name === 'InvalidParameterException' &&
      /USER_PASSWORD_AUTH|not enabled|not allowed/i.test(msg)
    ) {
      result = await attemptSignIn(null);
    } else {
      throw e;
    }
  }

  if (!result?.isSignedIn) {
    const step = result?.nextStep?.signInStep;
    if (step === 'CONFIRM_SIGN_UP') {
      const err = new Error('Account not confirmed');
      err.name = 'UserNotConfirmedException';
      throw err;
    }
    throw new Error(`Sign-in incomplete: ${step || 'unknown step'}`);
  }

  const session = await fetchAuthSession();
  const payload = session.tokens?.idToken?.payload;
  if (!payload) {
    throw new Error('Signed in but no ID token payload — check Amplify configuration');
  }
  const user = await getCurrentUser();
  return {
    session,
    user: mapSessionToUser(payload, user),
  };
}

export async function forgotPassword(email) {
  requireConfigured();
  await resetPassword({ username: email.trim().toLowerCase() });
}

export async function signOut() {
  try {
    await amplifySignOut();
  } catch {
    // ignore if already signed out
  }
}

export async function getCurrentAuthenticatedUser() {
  if (!isCognitoConfigured()) return null;
  try {
    const session = await fetchAuthSession();
    const payload = session.tokens?.idToken?.payload;
    if (!payload) return null;
    const user = await getCurrentUser();
    return mapSessionToUser(payload, user);
  } catch {
    return null;
  }
}

/**
 * Map Cognito / Amplify Auth errors to short, actionable copy.
 * Amplify v6 often wraps SDK errors; check name, message, and nested cause.
 */
export function cognitoErrorMessage(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;

  const name = String(err.name || err.code || err.__type || '');
  const rawMsg = String(err.message || err.msg || '');
  const lower = rawMsg.toLowerCase();
  const cause = err.cause || err.underlyingError;
  const causeMsg = cause ? String(cause.message || '') : '';
  const combined = `${name} ${rawMsg} ${causeMsg}`.toLowerCase();

  if (
    name === 'UserNotConfirmedException' ||
    combined.includes('user_not_confirmed') ||
    combined.includes('not confirmed') ||
    (combined.includes('verification') && !combined.includes('incorrect'))
  ) {
    return 'Your email is not verified yet. Enter the code we sent you, or use “Resend code” on the verification screen.';
  }
  // Wrong credentials — Cognito often says "Incorrect username or password" (contains "password": do not treat as policy error).
  if (
    name === 'NotAuthorizedException' ||
    name === 'UserNotFoundException' ||
    /not\s*authorized|incorrect\s+(username|email)\s+or\s+password|invalid\s+credentials|authentication failed/i.test(
      combined
    )
  ) {
    return 'Incorrect email or password. Check your details and try again.';
  }
  if (name === 'TooManyRequestsException' || combined.includes('too many')) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (name === 'PasswordResetRequiredException') {
    return 'You must reset your password before signing in. Use Forgot password.';
  }
  // Real password-policy errors (sign-up / change password), not "incorrect password" on sign-in.
  if (
    name === 'InvalidPasswordException' ||
    (name === 'InvalidParameterException' &&
      /policy|conform|at least|symbol|uppercase|lowercase|length|requirements|history/i.test(combined) &&
      !/incorrect|not authorized|authenticate/i.test(combined))
  ) {
    return 'Password does not meet the requirements for this account.';
  }

  if (rawMsg && rawMsg !== 'An unknown error has occurred.') {
    return name ? `${name}: ${rawMsg}` : rawMsg;
  }
  if (causeMsg) {
    return cognitoErrorMessage(cause);
  }
  if (name) {
    return `${name}: Sign-in failed. If you just registered, confirm your email with the code we sent first.`;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
