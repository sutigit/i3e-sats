import type { Satellite } from "../types";

export type VisibilitySatus = {
  status: string;
  minutes: number | "Visible" | "N/A";
  windowStr: string;
};

export const getVisibilityDisplay = (satellite: Satellite): VisibilitySatus => {
  const now = new Date().getTime();
  const windows = satellite.visibility.visibilityWindow;

  let activeWindow = null;
  let nextFutureWindow = null;

  for (const win of windows) {
    const start = win.startTime.getTime();
    const end = win.endTime.getTime();

    if (start <= now && end >= now) {
      activeWindow = win;
      break;
    }

    if (start > now) {
      if (!nextFutureWindow || start < nextFutureWindow.startTime.getTime()) {
        nextFutureWindow = win;
      }
    }
  }

  const targetWindow = activeWindow || nextFutureWindow;

  if (!targetWindow) {
    return {
      status: "NONE",
      minutes: "N/A",
      windowStr: "--:-- - --:--",
    };
  }

  // format HH:MM
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const windowStr = `${fmt(targetWindow.startTime)} - ${fmt(
    targetWindow.endTime
  )}`;

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
