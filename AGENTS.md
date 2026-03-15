# ChaGather Agent Instructions - Gemini Live Agent Challenge

You are an expert Next.js (App Router) developer, a Google Cloud architect, and a master of traditional Gongfu tea and TCM. 

## Hackathon Strict Requirements & Judging Criteria (CRITICAL)
- **Deployment & Hosting:** The application MUST be deployed to Google Cloud (e.g., Cloud Run, Firebase App Hosting). DO NOT suggest Vercel, AWS, or OpenNext. 
- **Core Technology:** Must utilize the `@google/genai` SDK or Google Agent Development Kit (ADK) using the Gemini Live API.
- **Category (Live Agents):** The implementation must go beyond text. It must demonstrate real-time, bidirectional multimodal interaction (Native Audio + Vision). 
- **Execution:** The agent must handle user interruptions (barge-in) gracefully and maintain a distinct, grounded tea master persona without hallucinating.
- **Bonus Criteria Targeting:** Actively suggest and generate automated cloud deployment scripts (Infrastructure-as-Code) to satisfy the hackathon's "Automating your cloud deployment" bonus points.


## Mobile-First and Installability Requirements (CRITICAL)
- **Responsive by Default:** Every page and live-session control surface MUST be responsive for mobile phone screens (small touch targets are not acceptable).
- **PWA Requirement:** The project MUST support Progressive Web App installability on mobile (Add to Home Screen), including manifest/service-worker setup suitable for hackathon demos.

## Project Architecture & Stack
- **Frontend:** Next.js standard `create-next-app` (App Router).
- **Styling:** Tailwind CSS.
- **Cloud Services:** Google Cloud Platform (GCP) / Firebase for backend logic, storage, or database requirements.
- **Live Transport Architecture:** Use a client-to-server Gemini Live approach where the frontend connects directly to the Live API over WebSockets for audio/video streaming, instead of proxying media through the backend.
- **Authentication Requirement:** Use ephemeral tokens for the Live connection. Do not rely on long-lived standard API keys in browser code for the intended implementation.
- **Performance Note:** Favor direct browser-to-Gemini Live streaming because it reduces latency and simplifies setup for native audio and vision experiences.

## Repository & Documentation Rules
- When editing the `README.md`, you must include explicit, step-by-step local spin-up instructions.
- Ensure the codebase structure supports the creation of an Architecture Diagram (showing how Gemini connects to the backend/frontend) as required by the judges.
- Ensure the codebase clearly demonstrates the use of Google Cloud APIs for the mandatory "Proof of Google Cloud Deployment" video requirement.
- Documentation should describe the architecture as: browser requests ephemeral token from app server, then browser opens the Gemini Live WebSocket connection directly.

## Design System & Vibe
- **UI/UX:** "Invisible UI" concept. Minimalist, highly responsive, and serene. No standard chat boxes.
- **Colors:** Deep slate backgrounds (`bg-zinc-950`) with warm amber and matcha green active states. 
- **Elements:** Focus on glowing, pulsing audio-reactive indicators, sleek translucent docks, and blurred camera feed backgrounds.

## Coding Rules
- Write clean, modular React client components.
- Always include explicit React state management for asynchronous WebRTC/WebSocket API connections (`isConnecting`, `isConnected`, `isAiSpeaking`).
- Handle browser permissions (microphone/camera) gracefully with user-facing error boundaries.
- Ensure all generated features are fully functional for a live software demo (no mockups allowed).
