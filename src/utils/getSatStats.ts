import { getSatelliteInfo, type SatelliteInfoOutput } from "tle.js";
import type { SatStat } from "../types";

// 1. Helper: Convert Degrees to Compass Direction
const getCompassDirection = (azimuth: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  // Divide 360 into 8 chunks of 45 degrees
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
};

// 2. Main Function
export const getSatStats = (
  tle: string,
  observerLat: number,
  observerLon: number,
  observerAlt: number = 0 // meters
): SatStat => {
  // Current timestamp
  const now = Date.now();

  // --- BASIC INFO (Position, Look Angles) ---
  // tle.js returns: { azimuth, elevation, range, velocity, height, lat, lng }
  const info: SatelliteInfoOutput = getSatelliteInfo(
    tle,
    now,
    observerLat,
    observerLon,
    observerAlt
  );

  // --- DOPPLER (Range Rate) TRICK ---
  // We can't get range-rate directly from tle.js without vectors.
  // So, we calculate range for 1 second ago and compare.
  // Negative = Approaching (Blue), Positive = Leaving (Red)
  const oneSecondAgo = now - 1000;
  const infoPast: SatelliteInfoOutput = getSatelliteInfo(
    tle,
    oneSecondAgo,
    observerLat,
    observerLon,
    observerAlt
  );

  const rangeRate = info.range - infoPast.range; // km/s

  // --- VISIBILITY (Simple Estimation) ---
  // A true eclipse check requires solar geometry (complex).
  // For a hobbyist, we check:
  // 1. Is it above the horizon? (Elevation > 10 degrees)
  // 2. Is it night time? (We assume yes if they are using the app)
  const isVisible = info.elevation > 10;

  return {
    // --- Where is it on the Map? ---
    location: {
      lat: info.lat,
      lon: info.lng,
      altitude: info.height, // km
    },

    // --- Where do I look? ---
    look: {
      azimuth: info.azimuth, // e.g. 270.5
      compass: getCompassDirection(info.azimuth), // e.g. "W"
      elevation: info.elevation, // e.g. 45.0
      range: info.range, // km
    },

    // --- Physics & Status ---
    physics: {
      speed: info.velocity, // km/s (Speed). NOTE: this is actually speed. the lib returns "velocity"
      rangeRate: rangeRate, // km/s (Doppler Speed)
    },

    // --- User Helpers ---
    status: {
      visible: isVisible,
    },
  };
};
