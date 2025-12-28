import {
  degreesLat,
  degreesLong,
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  radiansToDegrees,
  twoline2satrec,
  type EciVec3,
  type SatRec,
} from "satellite.js";
import type {
  TLE,
  Location,
  Geodetic,
  VisibilityWindow,
  SatVisibilityData,
  LookPoint,
} from "../types";

// --- CONSTANTS ---
const MIN_ELEVATION = 10; // Elevation degree, which determines when satellite is "visible".
const COARSE_STEP_MS = 4 * 60 * 1000; // 4 Minutes step interval to sample the visibility timings
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // 24 Hours lookahead of visibility time windows
const MIN_POINT_SPACING_MS = 60 * 1000; // 1 Minute minimum between look points

/** Calculates the specific Lat/Lon/Alt for a given time. */
const getLocationAtTime = (satrec: SatRec, date: Date): Location => {
  const gmst = gstime(date);
  const posVel = propagate(satrec, date);

  if (!posVel?.position || typeof posVel.position !== "object") {
    return { lat: 0, lon: 0, alt: 0 };
  }

  const pEci = posVel.position as EciVec3<number>;
  const pGeo = eciToGeodetic(pEci, gmst);

  return {
    lat: degreesLat(pGeo.latitude),
    lon: degreesLong(pGeo.longitude),
    alt: pGeo.height,
  };
};

/** * Helper to get raw ECF coordinates (km) for vector math
 */
const getEcfPosition = (satrec: SatRec, time: Date) => {
  const gmst = gstime(time);
  const posVel = propagate(satrec, time);

  if (posVel?.position && typeof posVel.position === "object") {
    const pEci = posVel.position as EciVec3<number>;
    // eciToEcf returns km
    return eciToEcf(pEci, gmst);
  }
  return { x: 0, y: 0, z: 0 };
};

/**
 * Generates 1 to 5 evenly spaced look points within a time window.
 */
const generateLookPoints = (
  satrec: SatRec,
  start: Date,
  end: Date
): LookPoint[] => {
  const duration = end.getTime() - start.getTime();
  const lookPoints: LookPoint[] = [];

  let count = Math.floor(duration / MIN_POINT_SPACING_MS);
  if (count > 5) count = 5;
  if (count < 1) count = 1;

  const stepSize = duration / (count + 1);

  for (let i = 1; i <= count; i++) {
    const timeA = new Date(start.getTime() + stepSize * i); // This is the exact time
    const timeB = new Date(timeA.getTime() + 1000);

    const locA = getLocationAtTime(satrec, timeA);
    const posA = getEcfPosition(satrec, timeA);
    const posB = getEcfPosition(satrec, timeB);

    lookPoints.push({
      location: locA,
      velocity: {
        x: posB.x - posA.x,
        y: posB.y - posA.y,
        z: posB.z - posA.z,
      },
      time: timeA,
    });
  }

  return lookPoints;
};

/**
 * Lightweight helper to get elevation for the lookahead loop.
 */
const getElevation = (
  satrec: SatRec,
  date: Date,
  observerGd: Geodetic
): number => {
  const posVel = propagate(satrec, date);
  if (!posVel?.position || typeof posVel.position !== "object") return -999;

  const gmst = gstime(date);
  const posEcf = eciToEcf(posVel.position as EciVec3<number>, gmst);
  const look = ecfToLookAngles(observerGd, posEcf);

  return radiansToDegrees(look.elevation);
};

/**
 * Linearly interpolates the exact time the satellite crosses the horizon.
 */
const findCrossingTime = (
  satrec: SatRec,
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
  satrec: SatRec,
  observerGd: Geodetic,
  now: Date
): VisibilityWindow[] => {
  const windows: SatVisibilityData["visibilityWindow"] = [];
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
            lookPoints: generateLookPoints(
              satrec,
              openWindowStart,
              crossingTime
            ),
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
      lookPoints: generateLookPoints(satrec, openWindowStart, finalDate),
    });
  }

  return windows;
};

// --- MAIN FUNCTION ---
export const getSatVisibilityData = (
  tle: TLE,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0,
  now: Date
): SatVisibilityData => {
  // 1. Setup
  const satrec = twoline2satrec(tle.line1, tle.line2);
  const observerGd: Geodetic = {
    latitude: degreesToRadians(observerLat),
    longitude: degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  // 2. Propagate Current State
  const gmst = gstime(now);
  const posVel = propagate(satrec, now);

  if (!posVel?.position || !posVel.velocity) {
    throw new Error("Satellite propagation failed");
  }

  const pEci = posVel.position as EciVec3<number>;
  const pEcf = eciToEcf(pEci, gmst);
  const look = ecfToLookAngles(observerGd, pEcf);
  const elevationDeg = radiansToDegrees(look.elevation);

  // 3. Calculate Visibility Window with LookPoints
  const visibilityWindow = calculateVisibilityWindows(satrec, observerGd, now);

  // 4. Return Data
  return {
    visible: elevationDeg > MIN_ELEVATION,
    visibilityWindow,
  };
};
