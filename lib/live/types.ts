export type BrewContext = {
  brewSeconds: number;
  ratio: string;
  tcmBenefit: string;
  teaName: string;
  temperature: string;
};

export type PresenceState = "idle" | "listening" | "processing" | "speaking";

export type TeaSessionSummary = {
  durationSeconds: number;
  reason: string;
  teaName?: string;
};

export type LiveSession = {
  sendRealtimeInput: (params: {
    audio?: { data: string; mimeType: string };
    video?: { data: string; mimeType: string };
    audioStreamEnd?: boolean;
    activityStart?: Record<string, never>;
    activityEnd?: Record<string, never>;
  }) => void;
  sendToolResponse: (params: {
    functionResponses:
      | {
          id?: string;
          name: string;
          response: Record<string, unknown>;
        }
      | Array<{
          id?: string;
          name: string;
          response: Record<string, unknown>;
        }>;
  }) => void;
  close: () => void;
};

export type EphemeralTokenResponse = {
  error?: string;
  token?: string;
};
