export const getCompassDirection = (azimuthDeg: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(azimuthDeg / 45) % 8;
  return directions[index];
};
