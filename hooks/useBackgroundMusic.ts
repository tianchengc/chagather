"use client";

import { useCallback, useMemo, useState } from "react";
import { MUSIC_TRACKS, resolveMusicTrack } from "@/lib/live/musicCatalog";

export function useBackgroundMusic() {
  const [hasActivated, setHasActivated] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(32);
  const [activeTrackId, setActiveTrackId] = useState("guqin");

  const stopMusic = useCallback(async () => {
    setIsMusicEnabled(false);
  }, []);

  const startMusic = useCallback(async () => {
    setHasActivated(true);
    setIsMusicEnabled(true);
  }, []);

  const toggleMusic = useCallback(() => {
    setIsMusicEnabled((current) => !current);
  }, []);

  const changeMusic = useCallback((params: { searchQuery?: string; vibe?: string }) => {
    const track = resolveMusicTrack(params.vibe, params.searchQuery);
    setActiveTrackId(track.id);
    setHasActivated(true);
    setIsMusicEnabled(true);
    return track;
  }, []);

  const activeTrack = useMemo(() => MUSIC_TRACKS[activeTrackId] ?? MUSIC_TRACKS.guqin, [activeTrackId]);

  return {
    activeTrack,
    changeMusic,
    hasActivated,
    isMusicEnabled,
    musicVolume,
    setMusicVolume,
    startMusic,
    stopMusic,
    toggleMusic,
  };
}
