/**
 * SkillRegistry — scans portal/agent-skills/ and exposes skills for progressive
 * disclosure. The agent first sees the list of {name, description}; only the
 * picked skill's SKILL.md body and prompt template are loaded into the final
 * Gemini system prompt.
 *
 * Layout:
 *   agent-skills/
 *     foundation/<name>/SKILL.md       # always-available skills
 *     shared/<name>/SKILL.md           # optional skills, merged in with foundation
 *     foundation/<name>/prompt.md      # Gemini user prompt template
 *     foundation/<name>/prompt.free.md       (optional tier variant)
 *     foundation/<name>/prompt.premium.md    (optional tier variant)
 *     users/<sub>/<name>/SKILL.md      # per-user override (wins over foundation/shared)
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface SkillMeta {
  name: string;
  description: string;
  inputs: string[];
  optionalInputs: string[];
  output: 'json' | 'text' | 'tiered';
  needsImage: boolean;
  premium: 'tiered' | 'required' | 'none';
  origin: 'foundation' | 'shared' | 'user';
}

export interface LoadedSkill {
  meta: SkillMeta;
  instructions: string;
  prompt: string;
  promptFree?: string;
  promptPremium?: string;
}

const SKILLS_ROOT = path.join(process.cwd(), 'agent-skills');
const FOUNDATION_DIR = path.join(SKILLS_ROOT, 'foundation');
const SHARED_DIR = path.join(SKILLS_ROOT, 'shared');
const USERS_DIR = path.join(SKILLS_ROOT, 'users');

let _metaCache: Map<string, SkillMeta> | null = null;
const _bodyCache = new Map<string, LoadedSkill>();

// ─── Frontmatter parser (minimal, no YAML dep) ────────────────────────────────

function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim();
  }
  return { data, body: match[2] };
}

function coerceList(value?: string): string[] {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function metaFromFrontmatter(fm: Record<string, string>, origin: 'foundation' | 'shared' | 'user'): SkillMeta {
  return {
    name: fm.name || '',
    description: fm.description || '',
    inputs: coerceList(fm.inputs),
    optionalInputs: coerceList(fm.optionalInputs),
    output: (fm.output as SkillMeta['output']) || 'json',
    needsImage: fm.needsImage === 'true',
    premium: (fm.premium as SkillMeta['premium']) || 'none',
    origin,
  };
}

// ─── Directory scan ───────────────────────────────────────────────────────────

async function scanDir(dir: string, origin: 'foundation' | 'shared'): Promise<Map<string, SkillMeta>> {
  const out = new Map<string, SkillMeta>();
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const skillPath = path.join(dir, name, 'SKILL.md');
    try {
      const raw = await fs.readFile(skillPath, 'utf8');
      const { data } = parseFrontmatter(raw);
      if (!data.name) continue;
      out.set(data.name, metaFromFrontmatter(data, origin));
    } catch {
      // skip malformed skill folders
    }
  }
  return out;
}

async function scanFoundation(): Promise<Map<string, SkillMeta>> {
  const [foundation, shared] = await Promise.all([
    scanDir(FOUNDATION_DIR, 'foundation'),
    scanDir(SHARED_DIR, 'shared'),
  ]);
  // shared merges in after foundation; foundation wins on name collision
  const merged = new Map(shared);
  foundation.forEach((v, k) => merged.set(k, v));
  return merged;
}

async function scanUser(userSub: string | undefined, base: Map<string, SkillMeta>): Promise<Map<string, SkillMeta>> {
  if (!userSub) return base;
  const userDir = path.join(USERS_DIR, userSub);
  let entries: string[];
  try {
    entries = await fs.readdir(userDir);
  } catch {
    return base;
  }
  const merged = new Map(base);
  for (const name of entries) {
    const skillPath = path.join(userDir, name, 'SKILL.md');
    try {
      const raw = await fs.readFile(skillPath, 'utf8');
      const { data } = parseFrontmatter(raw);
      if (!data.name) continue;
      merged.set(data.name, metaFromFrontmatter(data, 'user'));
    } catch {
      // skip
    }
  }
  return merged;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns {name, description} for every available skill — progressive disclosure. */
export async function listSkills(userSub?: string): Promise<Array<Pick<SkillMeta, 'name' | 'description' | 'origin'>>> {
  if (!_metaCache) _metaCache = await scanFoundation();
  const withUser = await scanUser(userSub, _metaCache);
  return Array.from(withUser.values()).map(m => ({
    name: m.name,
    description: m.description,
    origin: m.origin,
  }));
}

/** Full skill: metadata + SKILL.md body + prompt template(s). Cached. */
export async function loadSkill(name: string, userSub?: string): Promise<LoadedSkill | null> {
  const cacheKey = `${userSub || ''}::${name}`;
  const cached = _bodyCache.get(cacheKey);
  if (cached) return cached;

  if (!_metaCache) _metaCache = await scanFoundation();
  const merged = await scanUser(userSub, _metaCache);
  const meta = merged.get(name);
  if (!meta) return null;

  const baseDir =
    meta.origin === 'user'
      ? path.join(USERS_DIR, userSub!, name)
      : meta.origin === 'shared'
        ? path.join(SHARED_DIR, name)
        : path.join(FOUNDATION_DIR, name);

  const [rawSkill, prompt, promptFree, promptPremium] = await Promise.all([
    fs.readFile(path.join(baseDir, 'SKILL.md'), 'utf8'),
    safeRead(path.join(baseDir, 'prompt.md')),
    safeRead(path.join(baseDir, 'prompt.free.md')),
    safeRead(path.join(baseDir, 'prompt.premium.md')),
  ]);

  const { body: instructions } = parseFrontmatter(rawSkill);

  const loaded: LoadedSkill = {
    meta,
    instructions: instructions.trim(),
    prompt: (prompt || promptPremium || '').trim(),
    promptFree: promptFree?.trim(),
    promptPremium: promptPremium?.trim(),
  };
  _bodyCache.set(cacheKey, loaded);
  return loaded;
}

async function safeRead(p: string): Promise<string | undefined> {
  try { return await fs.readFile(p, 'utf8'); } catch { return undefined; }
}

// ─── Template renderer ────────────────────────────────────────────────────────

/**
 * Minimal Mustache-ish renderer:
 *   {{var}}                — interpolate (HTML not escaped, this goes to Gemini)
 *   {{#var}}...{{/var}}    — render block only if var is truthy (non-empty string/array/number)
 */
export function renderTemplate(tpl: string, vars: Record<string, unknown>): string {
  let out = tpl;

  out = out.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, inner) => {
    const v = vars[key];
    const truthy = Array.isArray(v) ? v.length > 0 : !!v;
    return truthy ? inner : '';
  });

  out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return '';
    return String(v);
  });

  return out;
}

/** Clear caches — useful in dev when editing SKILL.md files. */
export function invalidateSkillCache(): void {
  _metaCache = null;
  _bodyCache.clear();
}
