import type { Cartesian3, Quaternion, Viewer } from "cesium";

export type TLE = {
  name: string;
  line1: string;
  line2: string;
  full: string;
};

export type SatStat = {
  location: {
    lat: number; // Degrees (-90 to 90)
    lon: number; // Degrees (-180 to 180)
    altitude: number; // Kilometers (km)
  };

  look: {
    azimuth: number; // Degrees (0 to 360)
    compass: string; // Cardinal direction (e.g., "SW", "N")
    elevation: number; // Degrees (-90 to 90). >0 is above horizon.
    range: number; // Kilometers (km). Slant range (Observer -> Sat).
  };

  physics: {
    speed: number; // km/s. Scalar orbital speed.
    rangeRate: number; // km/s. Doppler shift estimate.
    // Negative (-) = Approaching
    // Positive (+) = Receding

    velocityVector: {
      // km/s. Vector components in ECI frame.
      x: number;
      y: number;
      z: number;
    };
  };

  status: {
    visible: boolean; // True if elevation > 10° (Simple horizon mask)
  };
};

export type SatelliteCardProps = {
  name: string;
  stat: SatStat;
};

export type Satellite = {
  name: string;
  tle: string;
  stat: SatStat;
};

export type Observer = {
  lon: number;
  lat: number;
};

export type SatellitesEntity = {
  satellites: Satellite[] | undefined;
  viewer: Viewer;
};

export type ObserverEntity = { observer: Observer; viewer: Viewer };

export type PathDrawEntity = {
  id: string;
  path: Cartesian3[];
  viewer: Viewer;
  mode: "space" | "ground";
};

export type PointDrawEntity = {
  id: string;
  position: Cartesian3;
  orientation: Quaternion;
  viewer: Viewer;
  mode: "space" | "ground";
};

export type ObserverDrawEntity = {
  id: string;
  position: Cartesian3;
  viewer: Viewer;
};
