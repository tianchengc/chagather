import type { BrewContext } from "./types";

const DEFAULT_BREW_SECONDS = 20;

const TEA_PROFILES: Record<string, BrewContext> = {
  tieguanyin: {
    brewSeconds: 20,
    ratio: "5g to 100ml",
    tcmBenefit: "Warms the stomach and supports digestion.",
    teaName: "Tieguanyin",
    temperature: "95°C",
  },
  "da hong pao": {
    brewSeconds: 15,
    ratio: "6g to 110ml",
    tcmBenefit: "Grounding warmth and post-meal comfort.",
    teaName: "Da Hong Pao",
    temperature: "100°C",
  },
  shoumei: {
    brewSeconds: 30,
    ratio: "4g to 120ml",
    tcmBenefit: "Gentle cooling balance and throat soothing.",
    teaName: "Shoumei",
    temperature: "90°C",
  },
  sencha: {
    brewSeconds: 45,
    ratio: "4g to 120ml",
    tcmBenefit: "Refreshes the mind and supports gentle clarity.",
    teaName: "Sencha",
    temperature: "75°C",
  },
};

export function fetchTeaData(teaName: string) {
  const normalized = teaName.trim().toLowerCase();
  return (
    TEA_PROFILES[normalized] ?? {
      brewSeconds: DEFAULT_BREW_SECONDS,
      ratio: "5g to 100ml",
      tcmBenefit: "Offers grounded comfort and calm focus.",
      teaName: teaName.trim() || "House Tea",
      temperature: "95°C",
    }
  );
}

export function resolveBrewTimerSeconds(teaName?: string, seconds?: number) {
  if (typeof seconds === "number" && Number.isFinite(seconds) && seconds > 0) {
    return Math.round(seconds);
  }

  if (teaName) {
    return fetchTeaData(teaName).brewSeconds;
  }

  return DEFAULT_BREW_SECONDS;
}
