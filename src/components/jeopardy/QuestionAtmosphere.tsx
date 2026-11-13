import { useId } from 'react';

// Pure decoration: SVG gradients fade the open segments; the center mask keeps
// the reading area quiet. The existing stage glow and entrance stay unchanged.
export function QuestionAtmosphere() {
  const id = `question-light-${useId().replace(/:/g, '')}`;
  return (
    <div aria-hidden="true" className="question-stage-light">
      <span />
      <svg className="question-light-forms" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <radialGradient id={`${id}-reading`}>
            <stop offset="0" stopColor="black" />
            <stop offset=".38" stopColor="black" />
            <stop offset=".68" stopColor="#888" />
            <stop offset=".9" stopColor="white" />
            <stop offset="1" stopColor="#aaa" />
          </radialGradient>
          <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="600">
            <rect width="1000" height="600" fill={`url(#${id}-reading)`} />
          </mask>
          <linearGradient id={`${id}-violet`} x1="0" y1="0" x2="1" y2=".8">
            <stop stopColor="#a99bd5" stopOpacity="0" />
            <stop offset=".3" stopColor="#a99bd5" stopOpacity=".30" />
            <stop offset=".65" stopColor="#716ba8" stopOpacity=".18" />
            <stop offset="1" stopColor="#716ba8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-blue`} x1="1" y1="0" x2="0" y2="1">
            <stop stopColor="#7b9ccf" stopOpacity="0" />
            <stop offset=".4" stopColor="#7b9ccf" stopOpacity=".26" />
            <stop offset=".75" stopColor="#8883ba" stopOpacity=".14" />
            <stop offset="1" stopColor="#8883ba" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g mask={`url(#${id}-mask)`} fill="none" strokeLinecap="round">
          <g className="question-light-rings" strokeWidth="1">
            <path d="M -80 420 C -130 20 230 -110 570 -30 C 870 40 1110 300 1015 560" stroke={`url(#${id}-violet)`} />
            <path d="M 110 620 C -30 400 80 130 340 78 C 620 22 900 200 885 410" stroke={`url(#${id}-blue)`} />
            <path d="M 260 565 C 120 390 220 200 405 160 C 630 110 800 300 728 465" stroke={`url(#${id}-violet)`} />
          </g>
        </g>
      </svg>
    </div>
  );
}
