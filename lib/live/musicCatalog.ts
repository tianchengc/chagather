export type MusicTrack = {
  fallbackVideoId: string;
  id: string;
  key: string;
  label: string;
  searchQuery: string;
};

export const MUSIC_TRACKS: Record<string, MusicTrack> = {
  bells: {
    fallbackVideoId: "sjkrrmBnpGE",
    id: "bells",
    key: "bells",
    label: "Meditation Bells",
    searchQuery: "meditation bells ambient youtube",
  },
  lofi: {
    fallbackVideoId: "jfKfPfyJRdk",
    id: "lofi",
    key: "lofi",
    label: "Tea House Lo-Fi",
    searchQuery: "tea house lofi ambient youtube",
  },
  flute: {
    fallbackVideoId: "sjkrrmBnpGE",
    id: "flute",
    key: "flute",
    label: "Bamboo Flute",
    searchQuery: "bamboo flute meditation music youtube",
  },
  rain: {
    fallbackVideoId: "mPZkdNFkNps",
    id: "rain",
    key: "rain",
    label: "Rain Meditation",
    searchQuery: "rain meditation ambient youtube",
  },
  piano: {
    fallbackVideoId: "jfKfPfyJRdk",
    id: "piano",
    key: "piano",
    label: "Quiet Piano",
    searchQuery: "gentle piano relaxation music youtube",
  },
  fireplace: {
    fallbackVideoId: "mPZkdNFkNps",
    id: "fireplace",
    key: "fireplace",
    label: "Fireplace Calm",
    searchQuery: "fireplace crackling ambient relaxation youtube",
  },
};

const MUSIC_MATCHERS: Array<{ key: keyof typeof MUSIC_TRACKS; patterns: string[] }> = [
  { key: "bells", patterns: ["bells", "temple", "bowl", "chime"] },
  { key: "lofi", patterns: ["lofi", "lo-fi", "study", "beats", "chill"] },
  { key: "flute", patterns: ["flute", "bamboo", "zen flute", "shakuhachi"] },
  { key: "rain", patterns: ["rain", "water", "nature", "forest", "stream"] },
  { key: "piano", patterns: ["piano", "keys", "classical", "soft piano"] },
  { key: "fireplace", patterns: ["fireplace", "fire", "hearth", "warm"] },
];

export function resolveMusicTrack(vibe?: string, searchQuery?: string) {
  const haystack = `${vibe ?? ""} ${searchQuery ?? ""}`.toLowerCase();

  for (const matcher of MUSIC_MATCHERS) {
    if (matcher.patterns.some((pattern) => haystack.includes(pattern))) {
      return MUSIC_TRACKS[matcher.key];
    }
  }

  return MUSIC_TRACKS.bells;
}
