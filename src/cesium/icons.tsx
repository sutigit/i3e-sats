const satelliteSVGString = `
<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'>
  <rect width='100' height='50' fill='rgba(94, 234, 212, 0.4)' stroke='#ccfbf1' stroke-width='10'/>
</svg>`.trim();

const telescopeSVGString = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path d="M32 42 L18 60 M32 42 L46 60 M32 42 L32 56" 
        stroke="#fbcfe8" stroke-width="3" stroke-linecap="round" fill="none"/>
  
  <g transform="rotate(-45, 32, 32)">
    <rect x="22" y="24" width="20" height="16" rx="2" 
          fill="rgba(251, 207, 232, 0.6)" stroke="#fbcfe8" stroke-width="2"/>
    <rect x="42" y="26" width="8" height="12" rx="1" fill="#fbcfe8"/> <rect x="16" y="29" width="6" height="6" rx="1" fill="#fbcfe8"/> </g>

  <circle cx="32" cy="42" r="4" fill="#fbcfe8"/>
</svg>
`.trim();


export const satelliteSVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(satelliteSVGString)}`;
export const observerSVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(telescopeSVGString)}`;