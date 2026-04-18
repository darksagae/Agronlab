#!/usr/bin/env node
/**
 * Production backend deploy (replaces sandbox for hosted/production Cognito).
 * Requires AMPLIFY_APP_ID in .env (AWS Amplify Console → your app → App ID).
 * Optional: AMPLIFY_BRANCH (default: main).
 *
 * Usage: node scripts/run-pipeline-deploy.mjs
 */
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

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
  console.error(
    'Missing app id. Add to .env (same value as Amplify Console → App ID):\n' +
      '  AMPLIFY_APP_ID=dxxxxxxxxxxxx\n' +
      '  AMPLIFY_BRANCH=main            # optional; branch linked to this backend\n'
  );
  process.exit(1);
}

process.env.CI = '1';

const args = [
  'ampx',
  'pipeline-deploy',
  '--branch',
  branch,
  '--app-id',
  appId,
  '--outputs-out-dir',
  root,
  '--outputs-version',
  '1.4',
];

console.log('Running: npx', args.join(' '));
const r = spawnSync('npx', args, {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, CI: '1' },
  shell: false,
});

if (r.status !== 0) process.exit(r.status ?? 1);

console.log('\nOK: pipeline-deploy finished. amplify_outputs.json written to repo root.');
console.log('Next: npm run amplify:copy-outputs  (copies into Expo app)');
