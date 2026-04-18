import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/adminAuth';
import { proxyStore, proxyJson } from '../../../../lib/storeProxy';

// POST /api/admin/products — create a new product
export async function POST(req: NextRequest) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const upstream = await proxyStore('/api/products', undefined, { method: 'POST', body });
    return proxyJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Store backend unavailable' }, { status: 502 });
  }
}
