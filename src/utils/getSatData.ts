import * as satellite from "satellite.js";
import type { SatData, TLE, Location, Geodetic } from "../types"; // Added Location type import

// --- TYPES ---

// --- CONSTANTS ---
const MIN_ELEVATION = 10; // Degrees
const COARSE_STEP_MS = 4 * 60 * 1000; // 4 Minutes
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // 24 Hours

// --- HELPERS ---

const getCompassDirection = (azimuthDeg: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azimuthDeg / 45) % 8;
  return directions[index];
};

/** * Calculates the specific Lat/Lon/Alt for a given time.
 */
const getLocationAtTime = (satrec: satellite.SatRec, date: Date): Location => {
  const gmst = satellite.gstime(date);
  const posVel = satellite.propagate(satrec, date);

  if (!posVel?.position || typeof posVel.position !== "object") {
    // Fallback for decay/error (should rarely happen in prediction window)
    return { lat: 0, lon: 0, alt: 0 };
  }

  const pEci = posVel.position as satellite.EciVec3<number>;
  const pGeo = satellite.eciToGeodetic(pEci, gmst);

  return {
    lat: satellite.degreesLat(pGeo.latitude),
    lon: satellite.degreesLong(pGeo.longitude),
    alt: pGeo.height,
  };
};

/**
 * Lightweight helper to get elevation for the lookahead loop.
 */
const getElevation = (
  satrec: satellite.SatRec,
  date: Date,
  observerGd: Geodetic
): number => {
  const posVel = satellite.propagate(satrec, date);
  if (!posVel?.position || typeof posVel.position !== "object") return -999;

  const gmst = satellite.gstime(date);
  const posEcf = satellite.eciToEcf(
    posVel.position as satellite.EciVec3<number>,
    gmst
  );
  const look = satellite.ecfToLookAngles(observerGd, posEcf);

  return satellite.radiansToDegrees(look.elevation);
};

/**
 * Linearly interpolates the exact time the satellite crosses the horizon.
 */
const findCrossingTime = (
  satrec: satellite.SatRec,
  observerGd: Geodetic,
  start: Date,
  end: Date
): Date => {
  const elev1 = getElevation(satrec, start, observerGd);
  const elev2 = getElevation(satrec, end, observerGd);

  const fraction = (MIN_ELEVATION - elev1) / (elev2 - elev1);
  const timeDiff = end.getTime() - start.getTime();

  return new Date(start.getTime() + fraction * timeDiff);
};

// --- CORE LOGIC: Visibility Calculation ---

const calculateVisibilityWindows = (
  satrec: satellite.SatRec,
  observerGd: Geodetic,
  now: Date
) => {
  const windows: SatData["visibility"]["visibilityWindow"] = [];
  const endTime = now.getTime() + LOOKAHEAD_MS;

  let scanTime = now.getTime();
  let isVisible = getElevation(satrec, now, observerGd) > MIN_ELEVATION;

  // Track the start of the current window
  let openWindowStart: Date | null = isVisible ? now : null;

  // Coarse Scan Loop
  while (scanTime < endTime) {
    const nextTime = scanTime + COARSE_STEP_MS;
    const nextDate = new Date(nextTime);
    const nextVisible =
      getElevation(satrec, nextDate, observerGd) > MIN_ELEVATION;

    if (isVisible !== nextVisible) {
      // Precise crossing time calculation
      const crossingTime = findCrossingTime(
        satrec,
        observerGd,
        new Date(scanTime),
        nextDate
      );

      if (isVisible && !nextVisible) {
        // EVENT: Setting (Visible -> Invisible)
        if (openWindowStart) {
          windows.push({
            startTime: openWindowStart,
            endTime: crossingTime,
            startPoint: getLocationAtTime(satrec, openWindowStart),
            endPoint: getLocationAtTime(satrec, crossingTime),
          });
        }
        openWindowStart = null;
      } else if (!isVisible && nextVisible) {
        // EVENT: Rising (Invisible -> Visible)
        openWindowStart = crossingTime;
      }
    }

    isVisible = nextVisible;
    scanTime = nextTime;
  }

  // Edge case: Close window if still open at end of 24h
  if (openWindowStart) {
    const finalDate = new Date(endTime);
    windows.push({
      startTime: openWindowStart,
      endTime: finalDate,
      startPoint: getLocationAtTime(satrec, openWindowStart),
      endPoint: getLocationAtTime(satrec, finalDate),
    });
  }

  return windows;
};

// --- MAIN FUNCTION ---

export const getSatData = (
  tle: TLE,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0
): SatData => {
  // 1. Setup
  const now = new Date();
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const observerGd: Geodetic = {
    latitude: satellite.degreesToRadians(observerLat),
    longitude: satellite.degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  // 2. Propagate Current State
  const gmst = satellite.gstime(now);
  const posVel = satellite.propagate(satrec, now);

  if (!posVel?.position || !posVel.velocity) {
    throw new Error("Satellite propagation failed");
  }

  const pEci = posVel.position as satellite.EciVec3<number>;
  const vEci = posVel.velocity as satellite.EciVec3<number>;

  // 3. Coordinate Transforms
  const pEcf = satellite.eciToEcf(pEci, gmst);
  const pGeo = satellite.eciToGeodetic(pEci, gmst);
  const look = satellite.ecfToLookAngles(observerGd, pEcf);

  // 4. Derived Physics (Speed & Doppler)
  const speed = Math.sqrt(vEci.x ** 2 + vEci.y ** 2 + vEci.z ** 2);

  let rangeRate = 0;
  const pastDate = new Date(now.getTime() - 1000);
  const pastPosVel = satellite.propagate(satrec, pastDate);

  if (pastPosVel && pastPosVel.position) {
    const pastPosEcf = satellite.eciToEcf(
      pastPosVel.position as satellite.EciVec3<number>,
      satellite.gstime(pastDate)
    );
    const pastLook = satellite.ecfToLookAngles(observerGd, pastPosEcf);
    rangeRate = look.rangeSat - pastLook.rangeSat;
  }

  // 5. Calculate Visibility Window with Locations
  const elevationDeg = satellite.radiansToDegrees(look.elevation);
  const azimuthDeg = satellite.radiansToDegrees(look.azimuth);
  const visibilityWindow = calculateVisibilityWindows(satrec, observerGd, now);

  // 6. Return Data
  return {
    location: {
      lat: satellite.degreesLat(pGeo.latitude),
      lon: satellite.degreesLong(pGeo.longitude),
      alt: pGeo.height,
    },
    look: {
      azimuth: azimuthDeg,
      compass: getCompassDirection(azimuthDeg),
      elevation: elevationDeg,
      range: look.rangeSat,
    },
    physics: {
      speed,
      rangeRate,
      velocityVector: { x: vEci.x, y: vEci.y, z: vEci.z },
    },
    visibility: {
      visible: elevationDeg > MIN_ELEVATION,
      visibilityWindow,
    },
    status: {
      visible: elevationDeg > MIN_ELEVATION,
    },
  };
};
