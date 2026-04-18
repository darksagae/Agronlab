#!/usr/bin/env node
/**
 * Pull amplify_outputs.json from an already-deployed production app (no deploy).
 * Same AMPLIFY_APP_ID / AMPLIFY_BRANCH as pipeline-deploy.
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const mobileOut = path.join(root, 'agrof-main/mobile/app');

function loadRootEnv() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i <= 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadRootEnv();

const appId =
  process.env.AWS_APP_ID?.trim() ||
  process.env.AMPLIFY_APP_ID?.trim();
const branch = (process.env.AWS_BRANCH || process.env.AMPLIFY_BRANCH || 'main').trim();

if (!appId) {
  console.error('Missing AMPLIFY_APP_ID (or AWS_APP_ID) in .env');
  process.exit(1);
}

const args = [
  'ampx',
  'generate',
  'outputs',
  '--branch',
  branch,
  '--app-id',
  appId,
  '--out-dir',
  mobileOut,
  '--format',
  'json',
  '--outputs-version',
  '1.4',
];

const r = spawnSync('npx', args, { cwd: root, stdio: 'inherit', env: process.env });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('OK: wrote amplify_outputs.json to', mobileOut);
