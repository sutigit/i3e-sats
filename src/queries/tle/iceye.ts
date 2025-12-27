import type { TLE } from "../../types";
import { mock_iceye_tle } from "../mock_tle/mock_iceye_tle";

const tle_iceye =
  "https://celestrak.org/NORAD/elements/gp.php?NAME=ICEYE&FORMAT=tle";

export async function getIceyeData() {
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
      const name = lines[i].trim();
      const line1 = lines[i + 1].trim();
      const line2 = lines[i + 2].trim();
      const rec: TLE = {
        name,
        line1,
        line2,
        full: `${name}\n${line1}\n${line2}`,
      };
      tle.push(rec);
    }

    return tle;
  } catch (error) {
    console.error((error as Error).message);
  }
}

export async function getIceyeMockData() {
  try {
    const text = mock_iceye_tle;
    const tle: TLE[] = [];
    const lines = text.split("\n");

    for (let i = 0; i < lines.length - 3; i += 3) {
      const name = lines[i].trim();
      const line1 = lines[i + 1].trim();
      const line2 = lines[i + 2].trim();
      const rec: TLE = {
        name,
        line1,
        line2,
        full: `${name}\n${line1}\n${line2}`,
      };
      tle.push(rec);
    }

    return tle;
  } catch (error) {
    console.error((error as Error).message);
  }
}
