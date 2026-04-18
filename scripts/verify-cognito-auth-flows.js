/**
 * Verifies the deployed Cognito app client allows USER_PASSWORD_AUTH.
 * Loads repo root .env into process.env (KEY=VALUE lines).
 */
const fs = require('fs');
const path = require('path');

(function loadRootEnv() {
  const envPath = path.join(__dirname, '..', '.env');
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
const {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const root = path.join(__dirname, '..');
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

if (!file) {
  console.error('FAIL: amplify_outputs.json not found');
  process.exit(1);
}

const outputs = JSON.parse(fs.readFileSync(file, 'utf8'));
const region = outputs.auth?.aws_region;
const userPoolId = outputs.auth?.user_pool_id;
const clientId = outputs.auth?.user_pool_client_id;

if (!region || !userPoolId || !clientId) {
  console.error('FAIL: missing auth fields in outputs');
  process.exit(1);
}

(async () => {
  const c = new CognitoIdentityProviderClient({ region });
  let json;
  try {
    json = await c.send(
      new DescribeUserPoolClientCommand({
        UserPoolId: userPoolId,
        ClientId: clientId,
      })
    );
  } catch (e) {
    console.error('FAIL: DescribeUserPoolClient:', e.name || e.message);
    console.error('Ensure AWS credentials are set (e.g. dotenv -e .env -- npm run verify:cognito).');
    process.exit(1);
  }

  const flows = json.UserPoolClient?.ExplicitAuthFlows || [];
  const need = 'ALLOW_USER_PASSWORD_AUTH';
  const has = flows.includes(need);

  console.log('Cognito app client:', clientId);
  console.log('ExplicitAuthFlows:', flows.length ? flows.join(', ') : '(empty)');

  if (!has) {
    console.error(
      `FAIL: ${need} not enabled. Run npm run sandbox:once so backend.ts applies the User Pool Client override.`
    );
    process.exit(1);
  }

  console.log(`OK: ${need} is enabled on the live app client.`);
})();
