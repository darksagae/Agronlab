/**
 * In-memory confirmation token store for two-phase skill actions.
 *
 * Tokens live for 5 minutes and are single-use. Suitable for:
 *  - place-order (prepare → user approves → commit)
 *  - any future skill with `requires_confirmation: true`
 *
 * Note: this is intentionally in-process. For multi-instance deployments,
 * swap the Map for a Redis-backed store or a short-lived AppSync record.
 * The API of this module is the only thing callers should depend on.
 */

import { randomBytes } from 'crypto';

export interface PendingAction {
  skill: string;
  userSub?: string;
  payload: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

const TTL_MS = 5 * 60 * 1000;
const store = new Map<string, PendingAction>();

function sweep() {
  const now = Date.now();
  store.forEach((action, token) => {
    if (action.expiresAt <= now) store.delete(token);
  });
}

export function createConfirmation(
  skill: string,
  payload: Record<string, unknown>,
  userSub?: string
): { token: string; expiresAt: string } {
  sweep();
  const token = `conf_${randomBytes(18).toString('base64url')}`;
  const now = Date.now();
  store.set(token, {
    skill,
    userSub,
    payload,
    createdAt: now,
    expiresAt: now + TTL_MS,
  });
  return { token, expiresAt: new Date(now + TTL_MS).toISOString() };
}

/** Consume a token. Returns null if missing, expired, or skill mismatch. */
export function consumeConfirmation(
  token: string,
  expectedSkill: string,
  userSub?: string
): PendingAction | null {
  sweep();
  const action = store.get(token);
  if (!action) return null;
  if (action.skill !== expectedSkill) return null;
  if (action.expiresAt <= Date.now()) {
    store.delete(token);
    return null;
  }
  if (action.userSub && userSub && action.userSub !== userSub) return null;
  store.delete(token);
  return action;
}
