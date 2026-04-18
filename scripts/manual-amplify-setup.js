const { CognitoIdentityProviderClient, CreateUserPoolCommand, CreateUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoIdentityClient, CreateIdentityPoolCommand, SetIdentityPoolRolesCommand } = require('@aws-sdk/client-cognito-identity');
const { S3Client, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { IAMClient, CreateRoleCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');
const fs = require('fs');

const region = 'us-east-1';
const cognitoIdp = new CognitoIdentityProviderClient({ region });
const cognitoIdentity = new CognitoIdentityClient({ region });
const s3 = new S3Client({ region });
const iam = new IAMClient({ region });

async function retry(fn, name, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.log(`[${name}] Attempt ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function run() {
  console.log('🚀 Starting manual resource generation...');

  // 1. User Pool
  const userPool = await retry(() => cognitoIdp.send(new CreateUserPoolCommand({
    PoolName: 'agron-manual-pool',
    AutoVerifiedAttributes: ['email'],
    UsernameAttributes: ['email'],
    Schema: [{ Name: 'email', AttributeDataType: 'String', Required: true }]
  })), 'CreateUserPool');
  const userPoolId = userPool.UserPool.Id;
  console.log(`✅ User Pool Created: ${userPoolId}`);

  // 2. User Pool Client
  const client = await retry(() => cognitoIdp.send(new CreateUserPoolClientCommand({
    UserPoolId: userPoolId,
    ClientName: 'agron-mobile-client',
    ExplicitAuthFlows: ['ALLOW_USER_PASSWORD_AUTH', 'ALLOW_REFRESH_TOKEN_AUTH', 'ALLOW_USER_SRP_AUTH']
  })), 'CreateUserPoolClient');
  const clientId = client.UserPoolClient.ClientId;
  console.log(`✅ User Pool Client Created: ${clientId}`);

  // 3. Identity Pool
  const idPool = await retry(() => cognitoIdentity.send(new CreateIdentityPoolCommand({
    IdentityPoolName: 'agron_manual_id_pool',
    AllowUnauthenticatedIdentities: true,
    CognitoIdentityProviders: [{
      ProviderName: `cognito-idp.${region}.amazonaws.com/${userPoolId}`,
      ClientId: clientId
    }]
  })), 'CreateIdentityPool');
  const identityPoolId = idPool.IdentityPoolId;
  console.log(`✅ Identity Pool Created: ${identityPoolId}`);

  // 4. S3 Bucket
  const bucketName = `agron-uploads-${Math.random().toString(36).substring(7)}`;
  await retry(() => s3.send(new CreateBucketCommand({ Bucket: bucketName })), 'CreateBucket');
  console.log(`✅ S3 Bucket Created: ${bucketName}`);

  const outputs = {
    auth: {
      user_pool_id: userPoolId,
      aws_region: region,
      user_pool_client_id: clientId,
      identity_pool_id: identityPoolId,
      mfa_methods: [],
      standard_required_attributes: ["email"],
      username_attributes: ["email"],
      user_verification_types: ["email"],
      groups: [],
      mfa_configuration: "NONE",
      unauthenticated_identities_enabled: true
    },
    storage: {
      aws_region: region,
      bucket_name: bucketName,
      buckets: [{
        name: "agrofUploads",
        bucket_name: bucketName,
        aws_region: region,
        paths: {
          "public/*": { "guest": ["get", "list"], "authenticated": ["get", "list", "write", "delete"] },
          "protected/\${cognito-identity.amazonaws.com:sub}/*": { "entityidentity": ["get", "list", "write", "delete"] },
          "uploads/*": { "authenticated": ["get", "list", "write", "delete"] },
          "uploads/\${cognito-identity.amazonaws.com:sub}/*": { "entityidentity": ["get", "list", "write", "delete"] }
        }
      }]
    },
    version: "1.4"
  };

  fs.writeFileSync('agrof-main/mobile/app/amplify_outputs.json', JSON.stringify(outputs, null, 2));
  console.log('🎉 Manual setup complete! amplify_outputs.json updated.');
}

run().catch(err => {
  console.error('💥 Fatal error during manual setup:', err);
  process.exit(1);
});
