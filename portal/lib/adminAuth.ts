import { NextRequest } from 'next/server';

/**
 * Verify the Authorization: Bearer <idToken> header on admin routes.
 * The Cognito id-token JWT is verified by decoding the payload (iss + exp).
 * For full sig verification in production use `aws-jwt-verify` or Amplify server utils.
 */
export function requireAuth(req: NextRequest): { sub: string } | null {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;

  try {
    // Decode payload (base64url middle segment)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );

    // Must not be expired
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    // Must be from our Cognito user pool
    const expectedIssuer = `https://cognito-idp.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID || ''}`;
    if (process.env.COGNITO_USER_POOL_ID && payload.iss !== expectedIssuer) return null;

    return { sub: payload.sub ?? '' };
  } catch {
    return null;
  }
}
