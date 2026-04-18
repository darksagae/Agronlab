/**
 * Adds ALLOW_USER_PASSWORD_AUTH to the app client (same intent as amplify/backend.ts override).
 * Use when sandbox deploy fails (network) but AWS credentials work.
 */
const fs = require('fs');
const path = require('path');
const {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
  UpdateUserPoolClientCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

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

(async () => {
  const c = new CognitoIdentityProviderClient({ region });
  const { UserPoolClient: uc } = await c.send(
    new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: clientId })
  );

  const flows = new Set(uc.ExplicitAuthFlows || []);
  const need = 'ALLOW_USER_PASSWORD_AUTH';
  if (flows.has(need)) {
    console.log('OK: already has', need);
    return;
  }
  flows.add(need);

  await c.send(
    new UpdateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      ClientName: uc.ClientName,
      RefreshTokenValidity: uc.RefreshTokenValidity,
      AccessTokenValidity: uc.AccessTokenValidity,
      IdTokenValidity: uc.IdTokenValidity,
      TokenValidityUnits: uc.TokenValidityUnits,
      ReadAttributes: uc.ReadAttributes,
      WriteAttributes: uc.WriteAttributes,
      ExplicitAuthFlows: [...flows],
      SupportedIdentityProviders: uc.SupportedIdentityProviders,
      CallbackURLs: uc.CallbackURLs,
      LogoutURLs: uc.LogoutURLs,
      AllowedOAuthFlows: uc.AllowedOAuthFlows,
      AllowedOAuthScopes: uc.AllowedOAuthScopes,
      AllowedOAuthFlowsUserPoolClient: uc.AllowedOAuthFlowsUserPoolClient,
      AnalyticsConfiguration: uc.AnalyticsConfiguration,
      PreventUserExistenceErrors: uc.PreventUserExistenceErrors,
      EnableTokenRevocation: uc.EnableTokenRevocation,
      EnablePropagateAdditionalUserContextData: uc.EnablePropagateAdditionalUserContextData,
      AuthSessionValidity: uc.AuthSessionValidity,
      RefreshTokenRotation: uc.RefreshTokenRotation,
    })
  );

  console.log('OK: updated app client with', need);
})().catch((e) => {
  const n = e.name || '';
  console.error('FAIL:', n || e.message);
  if (n === 'AccessDeniedException') {
    console.error(
      'IAM user needs cognito-idp:DescribeUserPoolClient and cognito-idp:UpdateUserPoolClient on this user pool, or run npm run sandbox:once when AWS SSM/DNS is reachable.'
    );
  }
  process.exit(1);
});
