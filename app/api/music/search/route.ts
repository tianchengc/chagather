import { NextRequest, NextResponse } from "next/server";
import { MUSIC_TRACKS } from "@/lib/live/musicCatalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get("trackId")?.trim() ?? "";
  const track = MUSIC_TRACKS[trackId];

  if (!track) {
    return NextResponse.json({ error: "Unknown soundscape track." }, { status: 400 });
  }

  const apiKey = process.env.YOUTUBE_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      source: "fallback",
      title: track.label,
      videoId: track.fallbackVideoId,
    });
  }

  const params = new URLSearchParams({
    key: apiKey,
    maxResults: "5",
    part: "snippet",
    q: track.searchQuery,
    safeSearch: "moderate",
    type: "video",
    videoEmbeddable: "true",
    videoSyndicated: "true",
  });

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        items?: Array<{
          id?: { videoId?: string };
          snippet?: { title?: string };
        }>;
      }
    | null;

  if (!response.ok) {
    return NextResponse.json({
      source: "fallback",
      title: track.label,
      videoId: track.fallbackVideoId,
    });
  }

  const firstMatch = payload?.items?.find((item) => item.id?.videoId);
  if (!firstMatch?.id?.videoId) {
    return NextResponse.json({
      source: "fallback",
      title: track.label,
      videoId: track.fallbackVideoId,
    });
  }

  return NextResponse.json({
    source: "youtube-search",
    title: firstMatch.snippet?.title ?? track.label,
    videoId: firstMatch.id.videoId,
  });
}
