/**
 * Server-side logger for AGRON agent skill runs.
 *
 * Writes one AgentSkillRun row per skill invocation so that:
 *   - Per-user evolution can derive personalised skill overrides
 *   - Foundation evolution can aggregate learnings across users
 *   - "Why did the agent do X?" debugging is possible for each run
 *
 * Writes use the AppSync API key auth mode since the Next.js route handler
 * has no per-request user JWT. This requires amplify_outputs.json to contain
 * `data.api_key`, which is generated once you run `npx ampx sandbox` after
 * adding `apiKeyAuthorizationMode` to `defineData`. Until that regeneration
 * happens, `logSkillRun` silently no-ops — it must never block the response.
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

type FeedbackEnum = 'PENDING' | 'POSITIVE' | 'NEGATIVE';

export interface LogSkillRunInput {
  skill: string;                     // folder name, e.g. "diagnose-crop"
  userSub?: string;
  country?: string;
  isPremium?: boolean;
  inputs?: Record<string, unknown>;  // non-image inputs — sanitised server-side
  outcome?: Record<string, unknown>; // structured extraction of the output
  rawOutput?: string;                // raw LLM text for replay; capped at ~8KB
  success: boolean;
  errorMessage?: string;
  latencyMs?: number;
}

let clientCache: ReturnType<typeof generateClient<Schema>> | null = null;
let amplifyConfigured = false;
let loggedDisabledReason = false;

/** Check whether the outputs file has an API key wired. */
function hasApiKey(): boolean {
  // The AppSync API key lands under data.api_key after ampx regenerates
  // the outputs. See amplify/data/resource.ts → apiKeyAuthorizationMode.
  const data = (outputs as { data?: { api_key?: string } }).data;
  return typeof data?.api_key === 'string' && data.api_key.length > 0;
}

function getClient(): ReturnType<typeof generateClient<Schema>> | null {
  if (!hasApiKey()) {
    if (!loggedDisabledReason) {
      console.warn(
        '[AgentSkillRun] logging disabled — amplify_outputs.json has no data.api_key. ' +
          'Run `npx ampx sandbox` to regenerate after adding apiKeyAuthorizationMode.',
      );
      loggedDisabledReason = true;
    }
    return null;
  }
  if (!amplifyConfigured) {
    Amplify.configure(outputs, { ssr: true });
    amplifyConfigured = true;
  }
  if (!clientCache) {
    clientCache = generateClient<Schema>({ authMode: 'apiKey' });
  }
  return clientCache;
}

/** Truncate long strings so we never ship a 500KB LLM response to AppSync. */
function cap(value: string | undefined, max = 8000): string | undefined {
  if (!value) return value;
  return value.length > max ? value.slice(0, max) + '…' : value;
}

/**
 * Fire-and-forget write. Returns the created row's id (useful for feedback
 * endpoints), or null if logging was skipped / failed.
 *
 * This function never throws — callers should not try/catch around it.
 */
export async function logSkillRun(input: LogSkillRunInput): Promise<string | null> {
  try {
    const client = getClient();
    if (!client) return null;
    const now = new Date().toISOString();
    const { data, errors } = await client.models.AgentSkillRun.create(
      {
        skill: input.skill,
        userSub: input.userSub ?? null,
        country: input.country ?? null,
        isPremium: input.isPremium ?? null,
        inputsJson: input.inputs ? JSON.stringify(input.inputs) : null,
        outcomeJson: input.outcome ? JSON.stringify(input.outcome) : null,
        rawOutput: cap(input.rawOutput) ?? null,
        success: input.success,
        errorMessage: input.errorMessage ?? null,
        latencyMs: input.latencyMs ?? null,
        feedback: 'PENDING',
        createdAt: now,
      },
      { authMode: 'apiKey' },
    );
    if (errors?.length) {
      console.warn('[AgentSkillRun] create returned errors', errors);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.warn('[AgentSkillRun] log failed', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Attach feedback to a previously-logged run. Used by the feedback endpoint.
 * Returns true on success, false if disabled / errored.
 */
export async function setSkillRunFeedback(
  runId: string,
  feedback: FeedbackEnum,
  note?: string,
): Promise<boolean> {
  try {
    const client = getClient();
    if (!client) return false;
    const { errors } = await client.models.AgentSkillRun.update(
      {
        id: runId,
        feedback,
        feedbackNote: note ?? null,
      },
      { authMode: 'apiKey' },
    );
    if (errors?.length) {
      console.warn('[AgentSkillRun] feedback update errors', errors);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[AgentSkillRun] feedback failed', err instanceof Error ? err.message : err);
    return false;
  }
}
