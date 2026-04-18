const { IAMClient, GetRoleCommand, CreateRoleCommand, AttachRolePolicyCommand, UpdateAssumeRolePolicyCommand } = require('@aws-sdk/client-iam');
const { CognitoIdentityClient, SetIdentityPoolRolesCommand, GetIdentityPoolRolesCommand } = require('@aws-sdk/client-cognito-identity');

const region = 'us-east-1';
const identityPoolId = 'us-east-1:6ca9c6a3-88c9-45d8-94b4-82af297aed04';
const iam = new IAMClient({ region });
const cognito = new CognitoIdentityClient({ region });

const trustPolicy = (principal) => JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Effect: 'Allow',
    Principal: { Federated: 'cognito-identity.amazonaws.com' },
    Action: 'sts:AssumeRoleWithWebIdentity',
    Condition: {
      StringEquals: { 'cognito-identity.amazonaws.com:aud': identityPoolId },
      'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': principal }
    }
  }]
});

async function ensureRole(roleName, principal) {
  try {
    const role = await iam.send(new GetRoleCommand({ RoleName: roleName }));
    console.log(`Role ${roleName} exists, updating trust policy...`);
    await iam.send(new UpdateAssumeRolePolicyCommand({
      RoleName: roleName,
      PolicyDocument: trustPolicy(principal)
    }));
    return role.Role.Arn;
  } catch (e) {
    if (e.name === 'NoSuchEntityException') {
      console.log(`Creating role ${roleName}...`);
      const role = await iam.send(new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: trustPolicy(principal)
      }));
      await iam.send(new AttachRolePolicyCommand({
        RoleName: roleName,
        PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess'
      }));
      return role.Role.Arn;
    }
    throw e;
  }
}

async function run() {
  console.log('Verifying Identity Pool Roles...');
  
  const authRoleArn = await ensureRole('agron-manual-auth-role', 'authenticated');
  const unauthRoleArn = await ensureRole('agron-manual-unauth-role', 'unauthenticated');

  console.log(`Setting roles for Identity Pool: ${identityPoolId}`);
  await cognito.send(new SetIdentityPoolRolesCommand({
    IdentityPoolId: identityPoolId,
    Roles: {
      authenticated: authRoleArn,
      unauthenticated: unauthRoleArn
    }
  }));

  console.log('✅ Identity Pool Roles set successfully.');
}

run().catch(console.error);
