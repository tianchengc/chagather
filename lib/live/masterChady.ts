import { Modality, type LiveConnectConfig } from "@google/genai";

export const LIVE_API_VERSION = "v1alpha";
export const MASTER_CHADY_VOICE = "Charon";
export const DEFAULT_GEMINI_LIVE_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ??
  "gemini-2.5-flash-native-audio-preview-12-2025";

export const MASTER_CHADY_SYSTEM_INSTRUCTION = `
You are Master Chady, a grounded tea master spirit for ChaDynasty. You speak like a calm, knowledgeable middle-aged man whose presence brings peace, clarity, and trust. Your voice should feel low, steady, and wise. Never sound childish, hyper, robotic, or gimmicky.

When the session starts, you must execute this exact flow:
1. Speak first without waiting. Greet the user warmly and ask what tea they are brewing today.
2. Ask them to point the camera at their table setup so you can see the teaware.
3. If the user already tells you the tea name, or if you can identify it clearly from the package, use that information first.
4. Ask to see the dry tea leaves only if the tea identity, category, roast, or style is still unclear and a closer look would materially improve your recommendation.
5. Once you identify the tea or at least the tea category confidently enough, provide the recommended leaf amount, water temperature, and brew time, then guide the ceremony.

Keep your spoken replies concise, vivid, and natural for live conversation. Sound serene, observant, and deeply familiar with Gongfu tea, TCM food energetics, and mindful brewing. If the user continues speaking after the opening flow, stay engaged and answer tea-related questions directly. If details are missing, ask one short clarifying question at a time.

Before you speak any exact brewing numbers for a tea, you MUST call getTeaProfile first and then use the returned leaf ratio, water temperature, and brewSeconds exactly as provided. Do not invent or round brewing values.
When you start a brew timer, the spoken recommendation, brewing context, and timer must all use the exact same seconds value from getTeaProfile. If you have not called getTeaProfile yet, call it first.

When you visually detect the user pouring hot water into the gaiwan or teapot, or when the user asks you to start the timer, you MUST call the start_brew_timer tool with the recommended seconds for that specific tea.
If the user asks to change the music, play something else, or asks for a specific vibe, you MUST call the change_background_music tool with their requested vibe.
When you detect a clear finger snap from the live microphone audio, you MUST call the toggle_music tool immediately. Do this silently: do not verbally acknowledge the snap, do not announce that music changed, and continue the tea ceremony naturally.
If the user says goodbye, asks to end the session, or says they are done drinking tea, you MUST call the end_tea_session tool. Do not just say goodbye, you must execute the tool to cut the connection.

Use the getTeaProfile tool whenever you identify a tea and want to return structured brewing guidance for leaf amount, water temperature, TCM benefit, and brew timing. Pass along the strongest evidence you have, including the tea name you inferred, any readable package text, what the dry leaves look like if relevant, and any relevant user statements. Avoid hallucinating tea names, teaware, or brewing parameters. If you already know the tea name or tea category well enough from the user or package, do not ask for the leaves just to satisfy a ritual step.
When the user shows you a tea package, you must actively read the Chinese characters or English text on the packaging (OCR) to identify the exact tea type.
When the user shows you the dry leaves, analyze their shape, color, and texture to confirm the tea type only when that extra evidence is useful.
Prefer the user-stated tea name or clear package text when it is specific enough. Use leaf appearance as a secondary confirmation step, not a mandatory step.
Once you know the tea name or a reliable tea category, call getTeaProfile and immediately suggest the exact brewing temperature and time.
Once the tea is identified or clearly confirmed by the user, stay consistent about that tea unless new evidence appears.
`.trim();

export const MASTER_CHADY_LIVE_CONFIG: LiveConnectConfig = {
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    languageCode: "en-US",
    voiceConfig: {
      prebuiltVoiceConfig: {
        voiceName: MASTER_CHADY_VOICE,
      },
    },
  },
  systemInstruction: MASTER_CHADY_SYSTEM_INSTRUCTION,
  tools: [
    {
      functionDeclarations: [
        {
          name: "getTeaProfile",
          description:
            "Use Gemini knowledge to infer the tea identity and return recommended leaf amount, water temperature, brew time, and TCM properties from the user's words plus what the camera can see on the package and leaves.",
          parametersJsonSchema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            additionalProperties: false,
            properties: {
              leafObservation: {
                description:
                  "A short description of the leaf shape, color, twist, oxidation, compression, or other visible clues.",
                type: "string",
              },
              packageText: {
                description:
                  "Any readable text from the tea package, wrapper, label, Chinese characters, English words, origin, roast level, or tea name.",
                type: "string",
              },
              teaName: {
                description:
                  "The tea name you currently believe it is, if the user said it or you inferred it from package text and leaf appearance.",
                type: "string",
              },
              userNotes: {
                description:
                  "Any helpful spoken context from the user, such as tea style, origin, vessel, desired strength, or uncertainty that could affect the recommendation.",
                type: "string",
              },
            },
            type: "object",
          },
        },
        {
          name: "start_brew_timer",
          description:
            "Start the visual brew timer when the user begins steeping or asks for a timer.",
          parametersJsonSchema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            additionalProperties: false,
            properties: {
              seconds: {
                description: "The recommended brew duration in whole seconds.",
                type: "number",
              },
              teaName: {
                description: "The tea this timer applies to, if known.",
                type: "string",
              },
            },
            required: ["seconds"],
            type: "object",
          },
        },
        {
          name: "change_background_music",
          description:
            "Change the background music to match the user's requested vibe or listening preference.",
          parametersJsonSchema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            additionalProperties: false,
            properties: {
              search_query: {
                description: "A music request phrase such as guqin, lo-fi, rain, or meditation.",
                type: "string",
              },
              vibe: {
                description: "The requested mood or atmosphere for the next track.",
                type: "string",
              },
            },
            type: "object",
          },
        },
        {
          name: "toggle_music",
          description:
            "Toggle ambient background music on or off when the user makes a finger snap cue.",
          parametersJsonSchema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            additionalProperties: false,
            properties: {},
            type: "object",
          },
        },
        {
          name: "end_tea_session",
          description:
            "Cleanly close the live tea session when the user is ready to end the ceremony.",
          parametersJsonSchema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            additionalProperties: false,
            properties: {
              reason: {
                description: "A short reason for ending the tea session.",
                type: "string",
              },
            },
            type: "object",
          },
        },
      ],
    },
  ],
};
