import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../lib/adminAuth';
import { proxyStore, proxyJson } from '../../../../lib/storeProxy';

// GET /api/admin/inventory?type=status|alerts|analytics
export async function GET(req: NextRequest) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const type = req.nextUrl.searchParams.get('type') ?? 'status';
  const pathMap: Record<string, string> = {
    status: '/api/inventory/status',
    alerts: '/api/inventory/alerts',
    analytics: '/api/inventory/analytics',
    reorder: '/api/inventory/reorder-suggestions',
  };
  const path = pathMap[type] ?? '/api/inventory/status';
  try {
    const upstream = await proxyStore(path);
    return proxyJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Store backend unavailable' }, { status: 502 });
  }
}

// POST /api/admin/inventory — update stock level
export async function POST(req: NextRequest) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const upstream = await proxyStore('/api/inventory/update-stock', undefined, { method: 'POST', body });
    return proxyJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Store backend unavailable' }, { status: 502 });
  }
}
