import type { BrewContext } from "./types";

const DEFAULT_BREW_SECONDS = 20;

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

export function createFallbackBrewContext(teaName?: string): BrewContext {
  const normalizedName = teaName?.trim();

  return {
    brewSeconds: DEFAULT_BREW_SECONDS,
    currentInfusion: 0,
    ratio: "5g to 100ml",
    tcmBenefit: "Supports a calm, balanced tea session.",
    teaCategory: "Unknown tea",
    teaName: normalizedName ? toTitleCase(normalizedName) : "Observed tea",
    temperature: "95C",
  };
}

export function normalizeBrewContext(
  value: Partial<BrewContext> | null | undefined,
  fallbackTeaName?: string,
): BrewContext {
  const fallback = createFallbackBrewContext(fallbackTeaName);

  const brewSecondsRaw = Number(value?.brewSeconds);
  const brewSeconds =
    Number.isFinite(brewSecondsRaw) && brewSecondsRaw > 0
      ? Math.round(brewSecondsRaw)
      : fallback.brewSeconds;

  const teaName =
    typeof value?.teaName === "string" && value.teaName.trim().length > 0
      ? value.teaName.trim()
      : fallback.teaName;

  return {
    brewSeconds,
    currentInfusion:
      typeof value?.currentInfusion === "number" && Number.isFinite(value.currentInfusion)
        ? Math.max(0, Math.round(value.currentInfusion))
        : fallback.currentInfusion,
    ratio:
      typeof value?.ratio === "string" && value.ratio.trim().length > 0
        ? value.ratio.trim()
        : fallback.ratio,
    tcmBenefit:
      typeof value?.tcmBenefit === "string" && value.tcmBenefit.trim().length > 0
        ? value.tcmBenefit.trim()
        : fallback.tcmBenefit,
    teaCategory:
      typeof value?.teaCategory === "string" && value.teaCategory.trim().length > 0
        ? value.teaCategory.trim()
        : fallback.teaCategory,
    teaName,
    temperature:
      typeof value?.temperature === "string" && value.temperature.trim().length > 0
        ? value.temperature.trim()
        : fallback.temperature,
  };
}

export function resolveBrewTimerSeconds(params: {
  brewContext?: BrewContext | null;
  seconds?: number;
}) {
  const secondsRaw = params.seconds;
  if (typeof secondsRaw === "number" && Number.isFinite(secondsRaw) && secondsRaw > 0) {
    return Math.round(secondsRaw);
  }

  if (params.brewContext?.brewSeconds && params.brewContext.brewSeconds > 0) {
    return Math.round(params.brewContext.brewSeconds);
  }

  return DEFAULT_BREW_SECONDS;
}
