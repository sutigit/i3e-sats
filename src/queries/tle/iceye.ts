import type { TLE } from "../../types";

const tle_iceye =
  "https://celestrak.org/NORAD/elements/gp.php?NAME=ICEYE&FORMAT=tle";

export async function getData() {
  const url = tle_iceye;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const tle: TLE[] = [];

    const text = await response.text();

    const lines = text.split("\n");

    for (let i = 0; i < lines.length - 3; i += 3) {
      const rec: TLE = {
        name: lines[i].trim(),
        line1: lines[i + 1].trim(),
        line2: lines[i + 2].trim(),
      };
      tle.push(rec);
    }

    return tle;
  } catch (error) {
    console.error((error as Error).message);
  }
}
