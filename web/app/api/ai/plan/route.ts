import { NextRequest, NextResponse } from 'next/server';

const PORTAL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.agron.uk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const upstream = await fetch(`${PORTAL}/api/ai/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ status: 'error', message: 'Plan service unavailable' }, { status: 502 });
  }
}
