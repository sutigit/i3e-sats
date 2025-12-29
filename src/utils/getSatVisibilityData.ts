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

const MIN_ELEVATION = 10;
const COARSE_STEP_MS = 4 * 60 * 1000;
const LOOKAHEAD_MS = 24 * 60 * 60 * 1000;
const MIN_POINT_SPACING_MS = 60 * 1000;

// Maximum duration of a LEO pass to backtrack (e.g., 20 mins)
const MAX_BACKTRACK_MS = 25 * 60 * 1000;

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

/** Helper to get raw ECF coordinates (km) for vector math */
const getEcfPosition = (satrec: SatRec, time: Date) => {
  const gmst = gstime(time);
  const posVel = propagate(satrec, time);

  if (posVel?.position && typeof posVel.position === "object") {
    const pEci = posVel.position as EciVec3<number>;
    return eciToEcf(pEci, gmst);
  }
  return { x: 0, y: 0, z: 0 };
};

/** Generates evenly spaced look points within a time window. */
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
    const timeA = new Date(start.getTime() + stepSize * i);
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

/** Lightweight helper to get elevation. */
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

/** Linearly interpolates the exact time the satellite crosses the horizon. */
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

/** * Finds the true rise time by searching backwards from 'now'.
 * Used when the satellite is already visible at the start of the scan.
 */
const findHistoricalRiseTime = (
  satrec: SatRec,
  observerGd: Geodetic,
  now: Date
): Date => {
  let backScan = now.getTime();
  const limit = backScan - MAX_BACKTRACK_MS;

  // Step backward until invisible
  while (backScan > limit) {
    const prevTime = backScan - COARSE_STEP_MS;
    const prevDate = new Date(prevTime);
    const isVisible =
      getElevation(satrec, prevDate, observerGd) > MIN_ELEVATION;

    if (!isVisible) {
      return findCrossingTime(satrec, observerGd, prevDate, new Date(backScan));
    }
    backScan = prevTime;
  }

  return now;
};

// --- Visibility Calculation ---
const calculateVisibilityWindows = (
  satrec: SatRec,
  observerGd: Geodetic,
  now: Date
): VisibilityWindow[] => {
  const windows: SatVisibilityData["visibilityWindow"] = [];
  const endTime = now.getTime() + LOOKAHEAD_MS;

  let scanTime = now.getTime();
  let isVisible = getElevation(satrec, now, observerGd) > MIN_ELEVATION;

  let openWindowStart: Date | null = null;

  if (isVisible) {
    // If visible NOW, find the TRUE start time in the past.
    // This anchors the window so it doesn't shift on reload.
    openWindowStart = findHistoricalRiseTime(satrec, observerGd, now);
  }

  while (scanTime < endTime) {
    const nextTime = scanTime + COARSE_STEP_MS;
    const nextDate = new Date(nextTime);
    const nextVisible =
      getElevation(satrec, nextDate, observerGd) > MIN_ELEVATION;

    if (isVisible !== nextVisible) {
      const crossingTime = findCrossingTime(
        satrec,
        observerGd,
        new Date(scanTime),
        nextDate
      );

      if (isVisible && !nextVisible) {
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

export const getSatVisibilityData = (
  tle: TLE,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0,
  now: Date
): SatVisibilityData => {
  const satrec = twoline2satrec(tle.line1, tle.line2);
  const observerGd: Geodetic = {
    latitude: degreesToRadians(observerLat),
    longitude: degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  const gmst = gstime(now);
  const posVel = propagate(satrec, now);

  if (!posVel?.position || !posVel.velocity) {
    throw new Error("Satellite propagation failed");
  }

  const pEci = posVel.position as EciVec3<number>;
  const pEcf = eciToEcf(pEci, gmst);
  const look = ecfToLookAngles(observerGd, pEcf);
  const elevationDeg = radiansToDegrees(look.elevation);

  const visibilityWindow = calculateVisibilityWindows(satrec, observerGd, now);

  return {
    visible: elevationDeg > MIN_ELEVATION,
    visibilityWindow,
  };
};
