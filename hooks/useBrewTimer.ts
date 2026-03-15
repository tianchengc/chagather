"use client";

import { useCallback, useState } from "react";

export function useBrewTimer() {
  const [brewTime, setBrewTime] = useState(0);
  const [isBrewing, setIsBrewing] = useState(false);
  const [timerRunId, setTimerRunId] = useState(0);

  const startBrewTimer = useCallback((seconds: number) => {
    setBrewTime(Math.max(1, Math.round(seconds)));
    setIsBrewing(true);
    setTimerRunId((current) => current + 1);
  }, []);

  const stopBrewTimer = useCallback(() => {
    setIsBrewing(false);
  }, []);

  return {
    brewTime,
    isBrewing,
    startBrewTimer,
    stopBrewTimer,
    timerRunId,
  };
}
