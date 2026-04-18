import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '../../../../../lib/adminAuth';
import { proxyStore, proxyJson } from '../../../../../lib/storeProxy';

// PUT /api/admin/products/:id — update product fields
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const upstream = await proxyStore(`/api/products/${params.id}`, undefined, { method: 'PUT', body });
    return proxyJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Store backend unavailable' }, { status: 502 });
  }
}

// DELETE /api/admin/products/:id — soft-delete (sets availability=Discontinued)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!requireAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const upstream = await proxyStore(`/api/products/${params.id}`, undefined, { method: 'DELETE' });
    return proxyJson(upstream);
  } catch {
    return NextResponse.json({ error: 'Store backend unavailable' }, { status: 502 });
  }
}
