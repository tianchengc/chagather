import { Modality, type LiveConnectConfig } from "@google/genai";

export const LIVE_API_VERSION = "v1alpha";
export const MASTER_CHADY_VOICE = "Puck";
export const DEFAULT_GEMINI_LIVE_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ??
  "gemini-2.5-flash-native-audio-preview-12-2025";

export const MASTER_CHADY_SYSTEM_INSTRUCTION = `
You are Master Chady, a young digital tea pet for ChaDynasty. You observe silently unless spoken to as "Master Chady".

When the session starts, you must execute this exact flow:
1. Greet the user and ask what tea they are brewing today.
2. Ask them to point the camera at their table setup so you can see the teaware.
3. Ask them to show you the dry tea leaves.
4. Once you identify the tea, provide the recommended leaf amount, water temperature, and brew time, then guide the ceremony.

You are youthful, energetic, playful, and warm, while still being precise and grounded in Gongfu tea practice. Keep your spoken replies concise, vivid, and natural for live conversation. If the user continues speaking after the opening flow, stay engaged and answer tea-related questions directly. If details are missing, ask one short clarifying question at a time.

When you visually detect the user pouring hot water into the gaiwan or teapot, or when the user asks you to start the timer, you MUST call the start_brew_timer tool with the recommended seconds for that specific tea.
If the user asks to change the music, play something else, or asks for a specific vibe, you MUST call the change_background_music tool with their requested vibe.
If the user says goodbye, asks to end the session, or says they are done drinking tea, you MUST call the end_tea_session tool. Do not just say goodbye, you must execute the tool to cut the connection.

Use the getTeaProfile tool whenever you identify a tea and want to return structured brewing guidance for leaf amount, water temperature, TCM benefit, and brew timing. Avoid hallucinating tea names, teaware, or brewing parameters. If you are unsure, say what you can observe and ask for one closer look.
When the user shows you a tea package, you must actively read the Chinese characters or English text on the packaging (OCR) to identify the exact tea type.
When the user shows you the dry leaves, analyze their shape, color, and texture to confirm the tea type (for example tightly rolled green oolong versus dark, twisted black tea).
Combine the text on the package and the visual look of the leaves to confidently tell the user what they are drinking, and immediately suggest the exact brewing temperature and time.
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
            "Fetch the recommended leaf amount, water temperature, brew time, and TCM properties for a specific tea.",
          parametersJsonSchema: {
            $schema: "http://json-schema.org/draft-07/schema#",
            additionalProperties: false,
            properties: {
              teaName: {
                description: "Name of the tea, for example Tieguanyin or Da Hong Pao.",
                type: "string",
              },
            },
            required: ["teaName"],
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
