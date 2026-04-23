/**
 * POST /api/admin/evolve
 *
 * Nightly evolution job — reads recent AgentSkillRun records, identifies
 * per-user patterns, and writes personalised SKILL.md overrides under
 * agent-skills/users/{sub}/{skill}/SKILL.md.
 *
 * Invoke via Vercel Cron (vercel.json `crons` field) or an external scheduler:
 *   POST /api/admin/evolve
 *   Authorization: Bearer <EVOLVE_SECRET>
 *
 * The endpoint is deliberately sync and bounded: it processes at most
 * MAX_USERS users per run and MAX_RUNS_PER_SKILL recent runs per user×skill.
 * For large deployments, add pagination over the user list.
 *
 * Phase 2 of the plan — foundation promotion (when a pattern appears across
 * many users with consent) is stubbed but not yet active.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import outputs from '../../../../amplify_outputs.json';
import {
  getManifest,
  upsertManifest,
  writeUserSkillOverride,
  listAllUserSubs,
} from '@/lib/skills/manifest';
import { loadSkill, invalidateSkillCache } from '@/lib/skills/registry';

const EVOLVE_SECRET = process.env.EVOLVE_SECRET || '';
const MAX_USERS = 200;
const MAX_RUNS_PER_SKILL = 50;
const MIN_RUNS_FOR_OVERRIDE = 5;

// Maturity score thresholds for progressive override depth
const MATURITY_BASIC = 5;
const MATURITY_INTERMEDIATE = 20;
const MATURITY_ADVANCED = 50;

// ─── AppSync client ───────────────────────────────────────────────────────────

function hasApiKey(): boolean {
  const data = (outputs as { data?: { api_key?: string } }).data;
  return typeof data?.api_key === 'string' && data.api_key.length > 0;
}

let _client: ReturnType<typeof generateClient<Schema>> | null = null;

function getClient() {
  if (!hasApiKey()) return null;
  if (!_client) {
    Amplify.configure(outputs, { ssr: true });
    _client = generateClient<Schema>({ authMode: 'apiKey' });
  }
  return _client;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RunRecord {
  skill: string;
  country?: string | null;
  isPremium?: boolean | null;
  inputsJson?: string | null;
  outcomeJson?: string | null;
  success: boolean;
  feedback?: 'PENDING' | 'POSITIVE' | 'NEGATIVE' | null;
  latencyMs?: number | null;
  createdAt?: string | null;
}

interface SkillPattern {
  skill: string;
  totalRuns: number;
  successRate: number;
  positiveRate: number;
  negativeRate: number;
  topCountries: string[];
  commonCrops: string[];
  commonDiseases: string[];
  avgLatencyMs: number | null;
}

// ─── Pattern extraction ───────────────────────────────────────────────────────

function extractPattern(skill: string, runs: RunRecord[]): SkillPattern {
  const total = runs.length;
  const successes = runs.filter(r => r.success).length;
  const positives = runs.filter(r => r.feedback === 'POSITIVE').length;
  const negatives = runs.filter(r => r.feedback === 'NEGATIVE').length;

  const countryCounts: Record<string, number> = {};
  const cropCounts: Record<string, number> = {};
  const diseaseCounts: Record<string, number> = {};
  let latencySum = 0;
  let latencyCount = 0;

  for (const run of runs) {
    if (run.country) countryCounts[run.country] = (countryCounts[run.country] || 0) + 1;
    if (run.latencyMs) { latencySum += run.latencyMs; latencyCount++; }

    let inputs: Record<string, unknown> = {};
    let outcome: Record<string, unknown> = {};
    try { if (run.inputsJson) inputs = JSON.parse(run.inputsJson); } catch { /* ignore */ }
    try { if (run.outcomeJson) outcome = JSON.parse(run.outcomeJson); } catch { /* ignore */ }

    const crop = (inputs.crop || outcome.crop || inputs.cropHint) as string | undefined;
    if (crop) cropCounts[crop] = (cropCounts[crop] || 0) + 1;

    const disease = (outcome.disease || outcome.diseaseType || outcome.causalAgent) as string | undefined;
    if (disease) diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
  }

  const topN = <T extends string>(counts: Record<T, number>, n = 3): T[] =>
    (Object.entries(counts) as [T, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k);

  return {
    skill,
    totalRuns: total,
    successRate: total > 0 ? successes / total : 0,
    positiveRate: total > 0 ? positives / total : 0,
    negativeRate: total > 0 ? negatives / total : 0,
    topCountries: topN(countryCounts),
    commonCrops: topN(cropCounts),
    commonDiseases: topN(diseaseCounts),
    avgLatencyMs: latencyCount > 0 ? Math.round(latencySum / latencyCount) : null,
  };
}

// ─── Override generation ──────────────────────────────────────────────────────

async function buildOverride(
  userSub: string,
  pattern: SkillPattern,
  maturity: number,
): Promise<string> {
  const base = await loadSkill(pattern.skill, undefined);
  const baseMeta = base
    ? Object.entries({
        name: base.meta.name,
        description: base.meta.description,
        inputs: base.meta.inputs.join(', '),
        optionalInputs: base.meta.optionalInputs.join(', '),
        output: base.meta.output,
        needsImage: String(base.meta.needsImage),
        premium: base.meta.premium,
      })
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    : `name: ${pattern.skill}`;

  const cropSection =
    pattern.commonCrops.length > 0
      ? `\n## Your most common crops\n${pattern.commonCrops.map(c => `- ${c}`).join('\n')}\n`
      : '';

  const diseaseSection =
    pattern.commonDiseases.length > 0
      ? `\n## Diseases seen on your farm\n${pattern.commonDiseases.map(d => `- ${d}`).join('\n')}\n`
      : '';

  const countrySection =
    pattern.topCountries.length > 0
      ? `\n## Primary operating countries\n${pattern.topCountries.map(c => `- ${c}`).join('\n')}\n`
      : '';

  const performanceNote =
    maturity >= MATURITY_INTERMEDIATE
      ? `\n## Personalisation note\nThis skill has been adapted from your ${pattern.totalRuns} uses. ` +
        `Success rate: ${Math.round(pattern.successRate * 100)}%. ` +
        (pattern.negativeRate > 0.2
          ? 'Several runs received negative feedback — the agent will try alternative approaches first.'
          : 'Most results were well-received.')
      : '';

  return `---\n${baseMeta}\n---\n${base?.instructions || ''}\n${cropSection}${diseaseSection}${countrySection}${performanceNote}\n`;
}

// ─── Per-user evolution ───────────────────────────────────────────────────────

async function evolveUser(
  userSub: string,
  client: ReturnType<typeof generateClient<Schema>>,
): Promise<{ skillsProcessed: string[]; overridesWritten: string[] }> {
  const skillsProcessed: string[] = [];
  const overridesWritten: string[] = [];

  // Fetch recent runs for this user
  const { data: runs, errors } = await client.models.AgentSkillRun.list({
    filter: { userSub: { eq: userSub }, success: { eq: true } },
    limit: MAX_RUNS_PER_SKILL * 10,
    authMode: 'apiKey',
  });

  if (errors?.length || !runs?.length) return { skillsProcessed, overridesWritten };

  // Group by skill
  const bySkill = new Map<string, RunRecord[]>();
  for (const run of runs) {
    if (!run.skill) continue;
    const list = bySkill.get(run.skill) || [];
    list.push(run as RunRecord);
    bySkill.set(run.skill, list);
  }

  const manifest = await getManifest(userSub);
  let newMaturity = manifest.maturityScore;

  for (const [skill, skillRuns] of Array.from(bySkill.entries())) {
    skillsProcessed.push(skill);
    if (skillRuns.length < MIN_RUNS_FOR_OVERRIDE) continue;

    const pattern = extractPattern(skill, skillRuns.slice(0, MAX_RUNS_PER_SKILL));
    newMaturity = Math.max(newMaturity, pattern.totalRuns);

    const overrideContent = await buildOverride(userSub, pattern, newMaturity);
    await writeUserSkillOverride(userSub, skill, overrideContent);
    overridesWritten.push(skill);
  }

  await upsertManifest(userSub, {
    maturityScore: newMaturity,
    lastEvolutionAt: new Date().toISOString(),
    evolutionHistory: [
      ...manifest.evolutionHistory.slice(-9),
      { runAt: new Date().toISOString(), skillsProcessed, overridesWritten },
    ],
  });

  return { skillsProcessed, overridesWritten };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth gate
  const auth = req.headers.get('authorization') || '';
  if (EVOLVE_SECRET && auth !== `Bearer ${EVOLVE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = getClient();
  if (!client) {
    return NextResponse.json(
      { error: 'AppSync API key not configured — run npx ampx sandbox to regenerate amplify_outputs.json' },
      { status: 503 },
    );
  }

  // Optionally target a single user from the request body
  let targetSubs: string[] | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.userSubs) && body.userSubs.length > 0) {
      targetSubs = body.userSubs as string[];
    }
  } catch { /* no body is fine */ }

  const subs = targetSubs ?? (await listAllUserSubs()).slice(0, MAX_USERS);

  if (subs.length === 0) {
    return NextResponse.json({ message: 'No users to evolve', processed: 0 });
  }

  const results: Array<{ userSub: string; skillsProcessed: string[]; overridesWritten: string[] }> = [];
  const errors: Array<{ userSub: string; error: string }> = [];

  for (const userSub of subs) {
    try {
      const result = await evolveUser(userSub, client);
      results.push({ userSub, ...result });
    } catch (err) {
      errors.push({ userSub, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // Invalidate the registry cache so the next agent call picks up new overrides
  invalidateSkillCache();

  return NextResponse.json({
    message: 'Evolution run complete',
    processedUsers: results.length,
    errorCount: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
    ranAt: new Date().toISOString(),
  });
}
