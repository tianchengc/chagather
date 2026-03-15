# Project context: "Live Tea Master Agent" for Gemini Live Agent Challenge

## Role
Act as an expert Next.js, Firebase, and Google Cloud Developer. Your goal is to help me build a real-time, multimodal (Vision + Audio) AI agent for a Gongfu tea ceremony application.

## Tech Stack & Architecture
- **Frontend:** Next.js (App Router), React, Tailwind CSS.
- **Backend/Deployment:** Firebase App Hosting (which provisions Google Cloud Run under the hood) and Firebase Functions (2nd Gen) for secure backend tool execution.
- **Database:** Firebase Firestore (for storing tea profiles and TCM data).
- **AI Integration:** Official `@google/genai` SDK.
- **Model:** `gemini-live-2.5-flash-native-audio`

## Architectural Rules (CRITICAL)
1. **Direct-to-Client WebRTC/WebSocket:** Do NOT route live audio/video streams through our Node.js/Next.js backend server. To maintain sub-second latency, the Next.js frontend MUST establish the Live API connection directly to Google's servers using the client-side SDK.
2. **Backend for Tools Only:** Firebase Functions (2nd Gen) will strictly be used to host the JSON function calls (e.g., `getTeaProfile()`, `startSteepTimer()`). The Gemini model will call these tools, the backend will execute them, and the result will be returned to the live session.
3. **Environment:** Use strict TypeScript. Handle browser API permissions (`getUserMedia` for mic/camera) gracefully with fallback UI.
4. **Domain Context:** The agent acts as a Master Tea Sommelier for ChaDynasty. The system prompt must instruct the agent to be calm, grounded in Traditional Chinese Medicine (TCM), and capable of guiding breathing exercises (like Ba Duan Jin) during steeping pauses.