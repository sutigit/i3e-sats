import type { Satellite } from "../types";

export type VisibilitySatus = {
  status: string;
  minutes: number | "Visible" | "N/A";
  windowStr: string;
};

export const getVisibilityDisplay = (satellite: Satellite): VisibilitySatus => {
  const now = new Date().getTime();
  const windows = satellite.visibility.visibilityWindow;

  // 1. Find the relevant window (Active or Next Future)
  let activeWindow = null;
  let nextFutureWindow = null;

  for (const win of windows) {
    const start = win.startTime.getTime();
    const end = win.endTime.getTime();

    // Is it happening right now?
    if (start <= now && end >= now) {
      activeWindow = win;
      break; // Priority found
    }

    // Is it in the future (Find the soonest one)
    if (start > now) {
      if (!nextFutureWindow || start < nextFutureWindow.startTime.getTime()) {
        nextFutureWindow = win;
      }
    }
  }

  // 2. Decide what to return based on what is found
  const targetWindow = activeWindow || nextFutureWindow;

  if (!targetWindow) {
    return {
      status: "NONE",
      minutes: "N/A",
      windowStr: "--:-- - --:--",
    };
  }

  // Helper to format HH:MM
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const windowStr = `${fmt(targetWindow.startTime)} - ${fmt(
    targetWindow.endTime
  )}`;

  // Calculate minutes difference
  if (activeWindow) {
    return {
      status: "VISIBLE",
      minutes: "Visible",
      windowStr,
    };
  } else {
    // Future window
    const diffMs = nextFutureWindow!.startTime.getTime() - now;
    const diffMins = Math.ceil(diffMs / (1000 * 60));
    return {
      status: "UPCOMING",
      minutes: diffMins,
      windowStr,
    };
  }
};
