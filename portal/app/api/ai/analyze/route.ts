import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildAISystemPrompt, getSeason } from '@/lib/countryConfig';
import { getLiveStoreContext } from '@/lib/storeContext';

const APPSYNC_URL = process.env.APPSYNC_URL || '';
const APPSYNC_API_KEY = process.env.APPSYNC_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_MODEL = 'gemini-2.5-flash';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'amplify-agronproject-dark-agrofuploadsbucketbf5869-hvmlqxic3qoj';

async function saveDiagnosisRecord(
  imageBuffer: Buffer,
  mimeType: string,
  analysis: Record<string, unknown>,
  userSub: string,
  isPremium: boolean,
  country: string,
  aiSource: string,
) {
  try {
    const recordId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const imageS3Key = `diagnoses/${userSub}/${recordId}/photo.${ext}`;

    if (process.env.AWS_ACCESS_KEY_ID) {
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: imageS3Key,
        Body: imageBuffer,
        ContentType: mimeType,
      }));
    }

    if (APPSYNC_URL && APPSYNC_API_KEY) {
      const mutation = `
        mutation CreateDiagnosisRecord($input: CreateDiagnosisRecordInput!) {
          createDiagnosisRecord(input: $input) { id }
        }
      `;
      await fetch(APPSYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': APPSYNC_API_KEY },
        body: JSON.stringify({
          query: mutation,
          variables: {
            input: {
              userSub,
              isPremium,
              scannedAt: new Date().toISOString(),
              country: country || 'UG',
              season: getSeason(country),
              imageS3Key,
              cropType: String(analysis.crop_type || 'unknown').toLowerCase(),
              healthStatus: String(analysis.health_status || 'unknown'),
              diseaseType: String(analysis.disease_type || 'none'),
              causalAgent: String(analysis.causal_agent || 'unknown'),
              severityLevel: String(analysis.severity_level || 'unknown'),
              confidenceScore: Number(analysis.confidence || 0),
              symptomsJson: JSON.stringify(analysis.symptoms || []),
              recommendationsJson: JSON.stringify(analysis.recommendations || []),
              productsJson: JSON.stringify(analysis.products_to_use || []),
              applicationMethod: String(analysis.application_method || ''),
              prevention: String(analysis.prevention || ''),
              urgency: String(analysis.urgency || ''),
              aiSource,
              aiModel: GEMINI_MODEL,
              userFeedback: 'PENDING',
              trainingStatus: 'PENDING',
            },
          },
        }),
      });
    }

    console.log(`[DiagnosisRecord] Saved: ${recordId} | country=${country} | crop=${analysis.crop_type} | disease=${analysis.disease_type}`);
    return { saved: true, recordId, imageS3Key };
  } catch (err) {
    console.error('[DiagnosisRecord] Save failed:', err);
    return { saved: false };
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ status: 'error', message: 'Gemini API key not configured' }, { status: 503 });
    }

    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const isPremium = formData.get('is_premium') === 'true';
    const cropHint = (formData.get('crop_type') as string) || '';
    const userSub = (formData.get('user_sub') as string) || 'anonymous';
    const country = (formData.get('country') as string) || 'UG';
    const userContext = (formData.get('user_context') as string) || '';

    if (!imageFile) {
      return NextResponse.json({ status: 'error', message: 'No image provided' }, { status: 400 });
    }

    const [arrayBuffer, storeContext] = await Promise.all([
      imageFile.arrayBuffer(),
      getLiveStoreContext(country === 'UG' ? 'UGX' : 'USD'),
    ]);
    const imageBuffer = Buffer.from(arrayBuffer);
    const base64 = imageBuffer.toString('base64');
    const mimeType = imageFile.type || 'image/jpeg';

    const systemPrompt = buildAISystemPrompt(country, 'analyze', {
      storeContext,
      userContext: userContext || undefined,
    });

    if (isPremium) {
      const payload = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          parts: [
            {
              text: cropHint
                ? `Analyze this ${cropHint} plant image. Return ONLY a JSON object with these exact fields: health_status, disease_type, crop_type, causal_agent, severity_level, confidence (0.0-1.0), symptoms (array), recommendations (array), products_to_use (array of AGRON store product names), application_method, prevention, urgency.`
                : `Analyze this crop plant image. Return ONLY a JSON object with these exact fields: health_status, disease_type, crop_type, causal_agent, severity_level, confidence (0.0-1.0), symptoms (array), recommendations (array), products_to_use (array of AGRON store product names), application_method, prevention, urgency.`,
            },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: { temperature: 0.2 },
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
      const rawText: string = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

      let analysis: Record<string, unknown> = {};
      try {
        const cleaned = rawText.replace(/```(?:json)?\s*/g, '').replace(/```\s*$/g, '').trim();
        analysis = JSON.parse(cleaned);
      } catch {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try { analysis = JSON.parse(match[0]); } catch { analysis = { raw_response: rawText }; }
        }
      }

      if (userSub !== 'anonymous') {
        saveDiagnosisRecord(imageBuffer, mimeType, analysis, userSub, true, country, 'gemini_premium');
      }

      return NextResponse.json({
        status: 'success',
        source: 'gemini_ai',
        message: 'Full AI diagnosis completed',
        timestamp: new Date().toISOString(),
        analysis: { ...analysis, detection_method: 'gemini_premium', kb_contribution: true },
      });
    }

    // Free path — lightweight preview
    const freePayload = {
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{
        parts: [
          {
            text: 'Look at this plant. In 2 sentences: 1) what crop is it, 2) does it look healthy or not, and if not — one possible issue. End with: "Upgrade to AGRON Premium for a full AI diagnosis with treatment plan and store product recommendations."',
          },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      }],
      generationConfig: { temperature: 0.3 },
    };

    const freeRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(freePayload),
    });

    const freeJson = await freeRes.json();
    const aiPreview: string = freeJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (userSub !== 'anonymous') {
      saveDiagnosisRecord(
        imageBuffer, mimeType,
        { crop_type: cropHint || 'unknown', health_status: 'unknown', disease_type: 'none', confidence: 0 },
        userSub, false, country, 'basic_free'
      );
    }

    return NextResponse.json({
      status: 'success',
      source: 'basic_free',
      message: 'Basic analysis only. Upgrade to Premium for full AI diagnosis with treatment plan.',
      timestamp: new Date().toISOString(),
      analysis: {
        health_status: 'unknown',
        disease_type: 'Inspection Required',
        severity_level: 'unknown',
        confidence: 0,
        symptoms: [],
        recommendations: [
          'Check leaves for spots, yellowing, or wilting',
          'Look under leaves for pests or insect eggs',
          'Ensure soil is not waterlogged or too dry',
          'Apply a general preventive fungicide if spots are present',
        ],
        products_to_use: [],
        prevention: 'Maintain good field hygiene and monitor crops weekly.',
        ai_preview: aiPreview,
        detection_method: 'basic_free',
        upgrade_prompt: {
          title: 'Get a precise AI diagnosis',
          body: 'AGRON Premium gives you instant Gemini AI analysis — exact disease name, severity, treatment plan, and AGRON store products to use.',
          price: 'UGX 37,000/year (~$10)',
        },
      },
    });

  } catch (err: unknown) {
    console.error('[AI analyze]', err);
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
