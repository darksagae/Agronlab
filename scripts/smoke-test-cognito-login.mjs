/**
 * Optional end-to-end: InitiateAuth with USER_PASSWORD_AUTH (same flow as Expo Go).
 * Set COGNITO_TEST_EMAIL and COGNITO_TEST_PASSWORD (confirmed user). Skips if unset.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

(function loadRootEnv() {
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
})();

const candidates = [
  path.join(root, 'amplify_outputs.json'),
  path.join(root, 'agrof-main/mobile/app/amplify_outputs.json'),
];
const file = candidates.find((p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
});

const email = process.env.COGNITO_TEST_EMAIL?.trim();
const password = process.env.COGNITO_TEST_PASSWORD;

if (!email || !password) {
  console.log('SKIP: smoke-test-cognito-login (set COGNITO_TEST_EMAIL and COGNITO_TEST_PASSWORD to run)');
  process.exit(0);
}

if (!file) {
  console.error('FAIL: amplify_outputs.json not found');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync(file, 'utf8'));
const region = outputs.auth?.aws_region;
const clientId = outputs.auth?.user_pool_client_id;

const c = new CognitoIdentityProviderClient({ region });
try {
  await c.send(
    new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: email.toLowerCase(),
        PASSWORD: password,
      },
    })
  );
  console.log('OK: InitiateAuth USER_PASSWORD_AUTH succeeded (credentials valid).');
} catch (e) {
  const n = e?.name || '';
  if (n === 'UserNotConfirmedException') {
    console.error('FAIL: user email not confirmed (verify in Cognito / inbox).');
    process.exit(1);
  }
  if (n === 'NotAuthorizedException') {
    console.error('FAIL: wrong password or user missing:', e.message);
    process.exit(1);
  }
  console.error('FAIL:', n || e?.message, e?.message || e);
  process.exit(1);
}
