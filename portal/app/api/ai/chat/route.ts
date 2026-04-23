import { NextRequest, NextResponse } from 'next/server';
import { buildAISystemPrompt } from '@/lib/countryConfig';
import { getLiveStoreContext } from '@/lib/storeContext';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ status: 'error', message: 'Gemini API key not configured' }, { status: 503 });
    }

    const { message, context, country, userContext } = await req.json();

    if (!message) {
      return NextResponse.json({ status: 'error', message: 'message is required' }, { status: 400 });
    }

    const storeContext = await getLiveStoreContext(country === 'UG' ? 'UGX' : 'USD');
    const systemPrompt = buildAISystemPrompt(country || 'UG', 'chat', {
      storeContext,
      userContext: userContext || undefined,
    });
    const userText = context ? `Context: ${context}\n\nUser: ${message}` : message;

    const payload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userText }] }],
    };

    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      return NextResponse.json({ status: 'error', message: `Gemini error: ${err}` }, { status: 502 });
    }

    const geminiJson = await geminiRes.json();
    const reply = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';

    return NextResponse.json({
      status: 'success',
      message: reply,
      timestamp: new Date().toISOString(),
    });

  } catch (err: unknown) {
    console.error('[AI chat]', err);
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
