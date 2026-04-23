/**
 * User skill manifest — tracks which skills are enabled for a given user and
 * records evolution maturity so the nightly job knows when a user has enough
 * run history to warrant personalised overrides.
 *
 * Layout: agent-skills/users/{userSub}/manifest.json
 *
 * The manifest is intentionally a flat JSON file, not an AppSync record.
 * It lives next to the user's SKILL.md overrides so the registry can find
 * both in one readdir pass. The nightly evolution job is the only writer.
 */

import { promises as fs } from 'fs';
import path from 'path';

const SKILLS_ROOT = path.join(process.cwd(), 'agent-skills');
const USERS_DIR = path.join(SKILLS_ROOT, 'users');

export interface UserManifest {
  userSub: string;
  enabledSkills: string[];
  maturityScore: number;
  createdAt: string;
  lastEvolutionAt: string | null;
  evolutionHistory: Array<{
    runAt: string;
    skillsProcessed: string[];
    overridesWritten: string[];
  }>;
}

const DEFAULT_ENABLED = [
  'diagnose-crop',
  'plan-season',
  'rotation-strategy',
  'budget-calculator',
  'product-search',
  'market-pricing',
  'place-order',
];

function manifestPath(userSub: string): string {
  return path.join(USERS_DIR, userSub, 'manifest.json');
}

export async function getManifest(userSub: string): Promise<UserManifest> {
  try {
    const raw = await fs.readFile(manifestPath(userSub), 'utf8');
    return JSON.parse(raw) as UserManifest;
  } catch {
    return createDefaultManifest(userSub);
  }
}

export async function upsertManifest(userSub: string, patch: Partial<UserManifest>): Promise<UserManifest> {
  const current = await getManifest(userSub);
  const updated = { ...current, ...patch };
  const dir = path.join(USERS_DIR, userSub);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(manifestPath(userSub), JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}

export function createDefaultManifest(userSub: string): UserManifest {
  return {
    userSub,
    enabledSkills: [...DEFAULT_ENABLED],
    maturityScore: 0,
    createdAt: new Date().toISOString(),
    lastEvolutionAt: null,
    evolutionHistory: [],
  };
}

/** List all user subs that have a manifest on disk. */
export async function listAllUserSubs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(USERS_DIR, { withFileTypes: true });
    const subs: string[] = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      try {
        await fs.access(path.join(USERS_DIR, e.name, 'manifest.json'));
        subs.push(e.name);
      } catch {
        // no manifest yet — skip
      }
    }
    return subs;
  } catch {
    return [];
  }
}

/** Ensure a user's directory exists (called on first login / first skill run). */
export async function ensureUserDir(userSub: string): Promise<void> {
  const dir = path.join(USERS_DIR, userSub);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(manifestPath(userSub));
  } catch {
    await upsertManifest(userSub, createDefaultManifest(userSub));
  }
}

/** Write a per-user skill override SKILL.md. Used by the evolution job. */
export async function writeUserSkillOverride(
  userSub: string,
  skillName: string,
  content: string,
): Promise<void> {
  const dir = path.join(USERS_DIR, userSub, skillName);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'SKILL.md'), content, 'utf8');
}
