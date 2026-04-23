/**
 * POST /api/ai/agent/feedback
 *
 * Attach thumbs-up / thumbs-down feedback to a prior AgentSkillRun row.
 * The run id is returned in the main /api/ai/agent response as `runId`.
 *
 * Body:
 *   { runId: string, feedback: 'POSITIVE' | 'NEGATIVE', note?: string }
 *
 * Used by:
 *   - The mobile app when a user rates a diagnosis / plan / order.
 *   - The portal chat UI when the merchant rates a response.
 *
 * Feedback rows are the raw signal the evolution job uses to decide which
 * skills to keep, tune, or replace with a user-specific variant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { setSkillRunFeedback } from '@/lib/skills/log';

type FeedbackValue = 'POSITIVE' | 'NEGATIVE';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { runId?: unknown; feedback?: unknown; note?: unknown };
    const runId = typeof body.runId === 'string' ? body.runId.trim() : '';
    const rawFeedback = typeof body.feedback === 'string' ? body.feedback.toUpperCase() : '';
    const note = typeof body.note === 'string' ? body.note : undefined;

    if (!runId) {
      return NextResponse.json({ status: 'error', message: 'runId is required' }, { status: 400 });
    }
    if (rawFeedback !== 'POSITIVE' && rawFeedback !== 'NEGATIVE') {
      return NextResponse.json(
        { status: 'error', message: 'feedback must be POSITIVE or NEGATIVE' },
        { status: 400 },
      );
    }

    const ok = await setSkillRunFeedback(runId, rawFeedback as FeedbackValue, note);
    if (!ok) {
      return NextResponse.json(
        { status: 'error', message: 'Feedback could not be recorded' },
        { status: 503 },
      );
    }
    return NextResponse.json({ status: 'success' });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Feedback failed' },
      { status: 500 },
    );
  }
}
