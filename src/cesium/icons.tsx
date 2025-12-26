// 1. Define SVG as a clean string
const satelliteSVGString = `
<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'>
  <rect width='100' height='50' fill='rgba(94, 234, 212, 0.4)' stroke='#ccfbf1' stroke-width='10'/>
</svg>`.trim();

// 2. Convert to Data URI
// This format is accepted by Cesium
export const satelliteSVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(satelliteSVGString)}`;