import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { normalizeBrewContext } from "@/lib/live/tea";
import type { BrewContext } from "@/lib/live/types";

const TEA_PROFILE_MODEL =
  process.env.GEMINI_TEA_PROFILE_MODEL ?? process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ?? "gemini-2.5-flash";

type TeaProfileRequest = {
  leafObservation?: string;
  packageText?: string;
  teaName?: string;
  userNotes?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPrompt(body: TeaProfileRequest) {
  const parts = [
    "You are a tea expert helping a live Gongfu tea assistant.",
    "Infer the most likely tea identity and brewing guidance from the provided evidence.",
    "Return practical Gongfu brewing guidance for the first infusion.",
    "Do not say you are uncertain unless evidence is genuinely weak. If uncertain, still give the best-fit recommendation and set teaCategory conservatively.",
    "Use concise values:",
    '- ratio should look like "5g to 100ml".',
    '- temperature should look like "95C" or "100C".',
    "- brewSeconds must be a whole number.",
    "- tcmBenefit should be a short plain-language sentence.",
  ];

  if (body.teaName?.trim()) {
    parts.push(`User-stated or model-inferred tea name: ${body.teaName.trim()}`);
  }

  if (body.packageText?.trim()) {
    parts.push(`Visible package text / OCR: ${body.packageText.trim()}`);
  }

  if (body.leafObservation?.trim()) {
    parts.push(`Leaf appearance notes: ${body.leafObservation.trim()}`);
  }

  if (body.userNotes?.trim()) {
    parts.push(`Extra live-session notes: ${body.userNotes.trim()}`);
  }

  parts.push(
    "Prefer the package text over the leaf guess when the package is explicit. When both are present, reconcile them and choose the most specific tea name you can defend.",
  );

  return parts.join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY for tea profile generation." },
      { headers: { "Cache-Control": "no-store, max-age=0" }, status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as TeaProfileRequest | null;
  const fallbackTeaName = body?.teaName?.trim() || undefined;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: TEA_PROFILE_MODEL,
      contents: buildPrompt(body ?? {}),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brewSeconds: {
              type: Type.NUMBER,
            },
            ratio: {
              type: Type.STRING,
            },
            tcmBenefit: {
              type: Type.STRING,
            },
            teaCategory: {
              type: Type.STRING,
            },
            teaName: {
              type: Type.STRING,
            },
            temperature: {
              type: Type.STRING,
            },
          },
          required: ["brewSeconds", "ratio", "tcmBenefit", "teaCategory", "teaName", "temperature"],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Gemini returned an empty tea profile response.");
    }

    const parsed = JSON.parse(text) as Partial<BrewContext>;
    const brewContext = normalizeBrewContext(parsed, fallbackTeaName);

    return NextResponse.json(brewContext, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate a dynamic tea profile.";

    return NextResponse.json(
      {
        brewContext: normalizeBrewContext(null, fallbackTeaName),
        error: message,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" }, status: 500 },
    );
  }
}
