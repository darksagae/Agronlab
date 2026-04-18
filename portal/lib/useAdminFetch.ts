'use client';

import { fetchAuthSession } from 'aws-amplify/auth';

/** Returns the Cognito id token for use in admin API calls. */
export async function getAdminHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const idToken = session.tokens?.idToken?.toString();
  if (!idToken) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${idToken}` };
}

/** Authenticated fetch to a portal API route. */
export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = await getAdminHeaders();
  return fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...headers, ...(init.headers ?? {}) },
  });
}
