import type { Satellite } from "../types";

type VisibilityState =
  | "ACTIVE" // Visible now (Top priority)
  | "FUTURE" // Visible later (Second priority)
  | "NONE"; // Not visible for next 24h (Last priority)

export const sortNearestSat = (
  satellites: Satellite[],
  now: Date
): Satellite[] => {
  const nowTime = now.getTime();

  // 1. MAP: Calculate the sorting state for every satellite once
  const mapped = satellites.map((sat) => {
    const windows = sat.visibility.visibilityWindow;

    let state: VisibilityState = "NONE";
    let sortKey = Number.MAX_SAFE_INTEGER; // Default for NONE (pushed to bottom)

    // Scan windows to find the "best" relevant window
    let activeWindow = null;
    let firstFutureWindow = null;

    for (const win of windows) {
      const start = win.startTime.getTime();
      const end = win.endTime.getTime();

      // Check if this window is currently active
      if (start <= nowTime && end >= nowTime) {
        activeWindow = win;
        break;
      }

      // Check for *soonest* future window
      if (start > nowTime) {
        if (
          !firstFutureWindow ||
          start < firstFutureWindow.startTime.getTime()
        ) {
          firstFutureWindow = win;
        }
      }
    }

    if (activeWindow) {
      state = "ACTIVE";
      sortKey = activeWindow.endTime.getTime();
    } else if (firstFutureWindow) {
      state = "FUTURE";
      sortKey = firstFutureWindow.startTime.getTime();
    }

    return { sat, state, sortKey };
  });

  mapped.sort((a, b) => {
    const priority = { ACTIVE: 0, FUTURE: 1, NONE: 2 };

    // Primary Sort: Compare tiers (Active vs Future vs None)
    if (priority[a.state] !== priority[b.state]) {
      return priority[a.state] - priority[b.state];
    }

    // Secondary Sort: If tiers are the same, compare the specific timestamps
    // - If both Active: earlier endTime wins (expires sooner)
    // - If both Future: earlier startTime wins (arrives sooner)
    return a.sortKey - b.sortKey;
  });

  return mapped.map((item) => item.sat);
};
