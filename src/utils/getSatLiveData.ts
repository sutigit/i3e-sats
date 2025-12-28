import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  geodeticToEcf,
  gstime,
  propagate,
  radiansToDegrees,
  twoline2satrec,
  type EciVec3,
} from "satellite.js";
import type {
  Geodetic,
  SatLiveData,
  Satellite,
  Location,
  LookPoinTabs,
} from "../types";
import { getCompassDirection } from "./getCompassDirection";

// Helper: Convert Location (Deg/Deg/Km) to satellite.js Geodetic (Rad/Rad/Km)
const toGeodetic = (loc: Location): Geodetic => ({
  latitude: degreesToRadians(loc.lat),
  longitude: degreesToRadians(loc.lon),
  height: loc.alt,
});

export const getSatLiveData = (
  satellite: Satellite,
  observerLat: number,
  observerLon: number,
  observerAltMeters: number = 0,
  now: Date
): SatLiveData => {
  // --- 1. SETUP ---
  const { tle, visibility } = satellite;
  const satrec = twoline2satrec(tle.line1, tle.line2);

  const observerGd: Geodetic = {
    latitude: degreesToRadians(observerLat),
    longitude: degreesToRadians(observerLon),
    height: observerAltMeters / 1000,
  };

  const nowMs = now.getTime();

  // --- 2. LIVE CALCULATIONS (Current State) ---
  const gmst = gstime(now);
  const posVel = propagate(satrec, now);

  // Default Empty State
  let liveData = {
    speed: 0,
    distance: 0,
    altitude: 0,
    compass: "N",
    azimuth: 0,
    elevation: 0,
  };

  if (
    posVel?.position &&
    posVel.velocity &&
    typeof posVel.position === "object"
  ) {
    const pEci = posVel.position as EciVec3<number>;
    const vEci = posVel.velocity as EciVec3<number>;

    // Transforms
    const pEcf = eciToEcf(pEci, gmst);
    const pGeo = eciToGeodetic(pEci, gmst);
    const look = ecfToLookAngles(observerGd, pEcf);
    const azDeg = radiansToDegrees(look.azimuth);

    liveData = {
      speed: Math.sqrt(vEci.x ** 2 + vEci.y ** 2 + vEci.z ** 2),
      distance: look.rangeSat,
      altitude: pGeo.height,
      compass: getCompassDirection(azDeg),
      azimuth: azDeg,
      elevation: radiansToDegrees(look.elevation),
    };
  }

  // --- 3. LOOK POINTS CALCULATIONS ---
  const lookPointsLive: SatLiveData["lookPointsLive"] = [];
  const lookPointsWindow: SatLiveData["lookPointsWindow"] = {};

  const windows = visibility.visibilityWindow || [];

  // Find active or next window
  let targetWindow = windows.find(
    (w) => w.startTime.getTime() <= nowMs && w.endTime.getTime() >= nowMs
  );
  if (!targetWindow) {
    targetWindow = windows.find((w) => w.startTime.getTime() > nowMs);
  }

  if (targetWindow && targetWindow.lookPoints.length > 0) {
    targetWindow.lookPoints.forEach((lp, index) => {
      // 1. Time Logic (Using pre-calculated time from LookPoint)
      const timeToDestination = lp.time.getTime() - nowMs;

      // 2. Geometry (Using the Helper)
      const lpGeodetic = toGeodetic(lp.location);
      const lpEcf = geodeticToEcf(lpGeodetic);

      const look = ecfToLookAngles(observerGd, lpEcf);
      const azDeg = radiansToDegrees(look.azimuth);

      // 3. Create Key (LP1, LP2...)
      // Ensure we only process up to 5 points to match the type definition
      if (index < 5) {
        const key = `LP${index + 1}` as LookPoinTabs;

        // Populate the Window Dictionary (The Static Data)
        lookPointsWindow[key] = lp;

        // Populate the Live Array (The Calculated Data)
        lookPointsLive.push({
          lp: key,
          timeToDestination,
          distance: look.rangeSat,
          altitude: lp.location.alt,
          compass: getCompassDirection(azDeg),
          azimuth: azDeg,
          elevation: radiansToDegrees(look.elevation),
        });
      }
    });
  }

  return {
    live: liveData,
    lookPointsLive,
    lookPointsWindow,
  };
};
