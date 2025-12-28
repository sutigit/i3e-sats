export const formatCountdown = (ms: number): string => {
  const isNegative = ms < 0;
  const absMs = Math.abs(ms);

  const totalSeconds = Math.floor(absMs / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  // Pad seconds with 0 (e.g., 5 -> "05")
  const sStr = s.toString().padStart(2, "0");

  // Pad minutes with 0 (optional, but looks cleaner: "01:05" vs "1:05")
  const mStr = m.toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}${mStr}:${sStr}`;
};
