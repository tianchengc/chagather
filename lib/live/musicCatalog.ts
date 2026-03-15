export type MusicTrack = {
  id: string;
  key: string;
  label: string;
  videoId: string;
};

export const MUSIC_TRACKS: Record<string, MusicTrack> = {
  calm: {
    id: "calm",
    key: "calm",
    label: "Meditation Bells",
    videoId: "sjkrrmBnpGE",
  },
  guqin: {
    id: "guqin",
    key: "guqin",
    label: "Guqin Stillness",
    videoId: "0LEE4SAj3rQ",
  },
  lofi: {
    id: "lofi",
    key: "lofi",
    label: "Tea House Lo-Fi",
    videoId: "jfKfPfyJRdk",
  },
  rain: {
    id: "rain",
    key: "rain",
    label: "Rain Meditation",
    videoId: "mPZkdNFkNps",
  },
  zen: {
    id: "zen",
    key: "zen",
    label: "Zen Breath",
    videoId: "XULUBg_ZcAU",
  },
};

const MUSIC_MATCHERS: Array<{ key: keyof typeof MUSIC_TRACKS; patterns: string[] }> = [
  { key: "guqin", patterns: ["guqin", "guzheng", "chinese", "traditional", "tea house"] },
  { key: "lofi", patterns: ["lofi", "lo-fi", "study", "beats", "chill"] },
  { key: "rain", patterns: ["rain", "water", "nature", "forest", "stream"] },
  { key: "zen", patterns: ["zen", "meditation", "quiet", "healing", "breath"] },
  { key: "calm", patterns: ["calm", "ambient", "peaceful", "soft", "relax"] },
];

export function resolveMusicTrack(vibe?: string, searchQuery?: string) {
  const haystack = `${vibe ?? ""} ${searchQuery ?? ""}`.toLowerCase();

  for (const matcher of MUSIC_MATCHERS) {
    if (matcher.patterns.some((pattern) => haystack.includes(pattern))) {
      return MUSIC_TRACKS[matcher.key];
    }
  }

  return MUSIC_TRACKS.guqin;
}
