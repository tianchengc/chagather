import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const LIVE_API_VERSION = "v1alpha";
const SESSION_EXPIRY_MS = 30 * 60 * 1000;
const NEW_SESSION_WINDOW_MS = 5 * 60 * 1000;

function expiresIn(durationMs: number) {
  return new Date(Date.now() + durationMs).toISOString();
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY for Gemini Live ephemeral token creation." },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
        status: 500,
      },
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: LIVE_API_VERSION },
    });

    const authToken = await ai.authTokens.create({
      config: {
        expireTime: expiresIn(SESSION_EXPIRY_MS),
        newSessionExpireTime: expiresIn(NEW_SESSION_WINDOW_MS),
        uses: 1,
      },
    });

    if (!authToken.name) {
      throw new Error("Gemini did not return an ephemeral auth token.");
    }

    return NextResponse.json(
      { token: authToken.name },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create a Gemini Live ephemeral auth token.";

    return NextResponse.json(
      { error: message },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
        status: 500,
      },
    );
  }
}
