import type { SatStat } from "../types";

export const coords = {
  otaniemi: { lon: 24.83, lat: 60.18 },
};

export const satDataFallback: SatStat = {
  location: { lat: 0, lon: 0, altitude: 0 },
  look: { azimuth: 0, compass: "--", elevation: 0, range: 0 },
  physics: { velocity: 0, rangeRate: 0 },
  status: { visible: false },
};
