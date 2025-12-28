const satelliteSVGString = `
<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'>
  <rect width='100' height='50' fill='rgba(94, 234, 212, 0.4)' stroke='#ccfbf1' stroke-width='10'/>
</svg>`.trim();

const pinSVGString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <ellipse cx="32" cy="61" rx="16" ry="4" fill="#EDDDD4"/>

  <path d="M 32 61
           C 34 56, 49 45, 49 34
           A 17 17 0 1 0 15 34
           C 15 45, 30 56, 32 61 Z"
        fill="#EDDDD4"/>
</svg>
`.trim();

export const satelliteSVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(satelliteSVGString)}`;
export const pinSVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(pinSVGString)}`;