# ChaGather

Traditional Gongfu tea master meets Gemini Live multimodal AI. ChaGather turns a tea table into a calm, responsive ceremony space where users can speak naturally, show their setup through the camera, and receive grounded brewing guidance from a distinct tea master persona in real time.
![ChaGather Thumbnail](./public/thumbnail.png)

## Why This Fits The Gemini Live Agent Challenge

- Built on the official `@google/genai` SDK with the Gemini Live API.
- Demonstrates native, bidirectional audio interaction instead of a text chat demo.
- Streams live camera frames from the browser so the agent can respond with visual context.
- Preserves a calm tea master persona with domain-specific tool responses for tea profiles.
- Uses an interruption-friendly live session model so the conversation can stay fluid during a ceremony.
- Includes a Google Cloud Run deployment script for the hackathon's automation bonus points.

## Experience Highlights

- Invisible UI: no chat box, no message feed, no generic bot avatar.
- Immersive dark tea-house atmosphere with amber and matcha accents.
- Blurred live camera background once microphone and camera permissions are granted.
- Pulsing orb that reflects connection and speaking state in real time.
- Gentle permission and transport error handling for live demos.

## Architecture

ChaGather uses a client-to-server Live architecture optimized for low-latency multimodal streaming:

- Next.js App Router frontend with React, TypeScript, and Tailwind CSS.
- Browser microphone capture plus camera capture in the client.
- Frontend requests a short-lived ephemeral token from the app server.
- Frontend then connects directly to the Gemini Live API over WebSockets with `@google/genai`.
- Audio and video stream directly from the browser to Gemini Live instead of proxying media through the backend.
- Native audio playback streamed back from Gemini Live.
- Local tea-profile tool response for structured brewing details.
- Google Cloud Run deployment via source-based build using `deploy.sh`.

This approach keeps streaming performance high because audio and video do not need to hop through the backend first. It is also simpler than building a full media proxy. For production use, ChaGather should use ephemeral tokens rather than exposing a standard API key in browser code.

## Local Spin-Up

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Open `.env.local` and set your server-side Gemini API key for ephemeral token minting:

```bash
GEMINI_API_KEY=your_actual_gemini_api_key
NEXT_PUBLIC_GEMINI_LIVE_MODEL=gemini-2.5-flash-native-audio-preview-12-2025
```

4. Start the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

6. Click the permission button to enable microphone and camera access.

7. Start a live session. The app should fetch an ephemeral token from the server and then connect directly from the browser to Gemini Live over WebSockets. Headphones are recommended for the cleanest demo.
8. If the live session fails immediately, confirm `GEMINI_API_KEY` is set server-side and rotate any previously exposed public Gemini API keys before retrying.


## Mobile Responsiveness & PWA

- ChaGather UI must remain responsive across phone, tablet, and desktop breakpoints, including the live floating dock and orb surface.
- The project is intended to be installable as a PWA on mobile devices (Add to Home Screen) for real-world tea table usage.
- Before demo submission, verify install prompts and home-screen launch behavior on at least one Android or iOS device.

## Validation

Run the project checks before recording your demo or deploying:

```bash
npm run typecheck
npm run build
```

## Google Cloud Run Deployment

ChaGather is optimized for Google Cloud Run with `output: "standalone"` and a root deployment script.

1. Make the script executable:

```bash
chmod +x deploy.sh
```

2. Export the required deployment variables:

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SERVICE_NAME="chagather"
export GEMINI_API_KEY="your_actual_gemini_api_key"
```

3. Deploy to Google Cloud Run:

```bash
./deploy.sh
```

## Proof Of Google Cloud Deployment

Placeholder video link:

`TODO: Add Devpost video or unlisted YouTube link showing Cloud Run deployment proof.`

## Architecture Diagram

Placeholder diagram link:

`TODO: Add architecture diagram image or Figma link showing Browser -> Next.js UI -> Gemini Live -> Google Cloud Run deployment path.`

Recommended diagram path:

`Browser UI -> Next.js token endpoint -> Ephemeral token -> Gemini Live WebSocket session`

## Demo Script Notes

- Start with the tea table visible in the camera.
- Show permission flow and the live blurred background.
- Demonstrate natural voice conversation and interruption handling.
- Ask for a tea recommendation or brewing profile to trigger the tea tool response.
- Close by showing the deployed Cloud Run URL and architecture diagram in the submission.

## Tech Stack

- Next.js 15 App Router
- React 19
- Tailwind CSS
- TypeScript
- `@google/genai`
- Google Cloud Run

## Roadmap After Hackathon

- Persist tea sessions and tea inventory for returning customers.
- Add commerce-aware ceremony flows for physical tea product recommendations.
- Expand multimodal guidance around teaware recognition and steep timing.

Built for the Gemini Live Agent Challenge and designed to grow into a real tea business experience.
