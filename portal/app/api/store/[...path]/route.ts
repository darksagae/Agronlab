import { NextRequest, NextResponse } from 'next/server';
import { proxyStore, proxyJson } from '../../../../lib/storeProxy';

// Map portal /api/store/<segments> → store-backend /api/<segments>
// e.g. /api/store/products?limit=10 → http://localhost:3001/api/products?limit=10

async function handle(req: NextRequest, { params }: { params: { path: string[] } }) {
  const backendPath = `/api/${params.path.join('/')}`;
  const searchParams = req.nextUrl.searchParams;

  let body: unknown;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      body = await req.json();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstream = await proxyStore(backendPath, searchParams, {
      method: req.method,
      body,
    });
    return proxyJson(upstream);
  } catch (err) {
    console.error('[store proxy] upstream error:', err);
    return NextResponse.json({ error: 'Store backend unavailable' }, { status: 502 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = () =>
  new Response(null, {
    status: 204,
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE', 'Access-Control-Allow-Headers': 'Content-Type' },
  });
