export type TLE = {
  name: string;
  line1: string;
  line2: string;
  tle: string;
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
    range: number; // Kilometers (km). Distance from observer to sat.
  };

  physics: {
    speed: number; // km/s. Orbital speed.
    rangeRate: number; // km/s. Doppler shift estimate.
    // Negative (-) = Approaching (Blue Shift)
    // Positive (+) = Moving Away (Red Shift)
  };

  status: {
    visible: boolean; // True if elevation > 10° (or your horizon mask)
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
