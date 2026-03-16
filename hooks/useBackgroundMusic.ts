"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MUSIC_TRACKS, resolveMusicTrack } from "@/lib/live/musicCatalog";

type MusicPlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export function useBackgroundMusic() {
  const [hasActivated, setHasActivated] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(false);
  const [musicVolume, setMusicVolume] = useState(32);
  const [activeTrackId, setActiveTrackId] = useState("bells");
  const [activeVideoId, setActiveVideoId] = useState(MUSIC_TRACKS.bells.fallbackVideoId);
  const [playbackError, setPlaybackError] = useState("");
  const [playbackState, setPlaybackState] = useState<MusicPlaybackState>("idle");
  const [isTrackPickerOpen, setIsTrackPickerOpen] = useState(false);

  const stopMusic = useCallback(async () => {
    setIsMusicEnabled(false);
    setPlaybackState("paused");
  }, []);

  const startMusic = useCallback(async () => {
    setHasActivated(true);
    setIsMusicEnabled(true);
    setPlaybackError("");
    setPlaybackState("loading");
  }, []);

  const toggleMusic = useCallback(() => {
    let nextEnabled = false;
    setIsMusicEnabled((current) => {
      nextEnabled = !current;
      return nextEnabled;
    });
    if (!hasActivated) {
      setHasActivated(true);
    }
    setPlaybackError("");
    setPlaybackState(nextEnabled ? "loading" : "paused");
    return nextEnabled;
  }, [hasActivated]);

  const changeMusic = useCallback((params: { searchQuery?: string; vibe?: string }) => {
    const track = resolveMusicTrack(params.vibe, params.searchQuery);
    setActiveTrackId(track.id);
    setHasActivated(true);
    setIsMusicEnabled(true);
    setPlaybackError("");
    setPlaybackState("loading");
    return track;
  }, []);

  const selectTrack = useCallback((trackId: string) => {
    const track = MUSIC_TRACKS[trackId] ?? MUSIC_TRACKS.bells;
    setActiveTrackId(track.id);
    setHasActivated(true);
    setPlaybackError("");
    setPlaybackState(isMusicEnabled ? "loading" : "paused");
    return track;
  }, [isMusicEnabled]);

  const handlePlaybackError = useCallback((message: string) => {
    if (!message) {
      setPlaybackError("");
      setPlaybackState(isMusicEnabled ? "loading" : "paused");
      return;
    }
    setPlaybackError(message);
    setPlaybackState("error");
  }, [isMusicEnabled]);

  const handlePlaybackStateChange = useCallback((nextState: MusicPlaybackState) => {
    setPlaybackState(nextState);
    if (nextState !== "error") {
      setPlaybackError("");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const activeTrack = MUSIC_TRACKS[activeTrackId] ?? MUSIC_TRACKS.bells;

    const resolvePlayableTrack = async () => {
      try {
        const response = await fetch(`/api/music/search?trackId=${encodeURIComponent(activeTrack.id)}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | { title?: string; videoId?: string }
          | null;

        if (cancelled) {
          return;
        }

        setActiveVideoId(payload?.videoId || activeTrack.fallbackVideoId);
      } catch {
        if (!cancelled) {
          setActiveVideoId(activeTrack.fallbackVideoId);
        }
      }
    };

    void resolvePlayableTrack();

    return () => {
      cancelled = true;
    };
  }, [activeTrackId]);

  const activeTrack = useMemo(() => {
    const baseTrack = MUSIC_TRACKS[activeTrackId] ?? MUSIC_TRACKS.bells;
    return {
      ...baseTrack,
      videoId: activeVideoId,
    };
  }, [activeTrackId, activeVideoId]);

  return {
    activeTrack,
    activeTrackId,
    changeMusic,
    hasActivated,
    handlePlaybackError,
    handlePlaybackStateChange,
    isMusicEnabled,
    isTrackPickerOpen,
    musicVolume,
    playbackError,
    playbackState,
    selectTrack,
    setIsTrackPickerOpen,
    setMusicVolume,
    startMusic,
    stopMusic,
    toggleMusic,
  };
}
