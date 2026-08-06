'use client';

import './sea.css';

type Props = {
  horizonY: number;
  night: boolean;
};

/**
 * Simple blue water plane with a rippled horizon line.
 */
export function AnimatedSea({ horizonY, night }: Props) {
  const base = night
    ? 'linear-gradient(to bottom, #1e4a6e 0%, #143552 40%, #0c2438 100%)'
    : 'linear-gradient(to bottom, #3a8fb5 0%, #2a7a9e 35%, #1e6585 100%)';

  return (
    <div className="cm-sea z-0" style={{ height: `${100 - horizonY}%` }} aria-hidden>
      <div className="cm-sea__base" style={{ background: base }} />
      <svg
        className="cm-sea__horizon-wave"
        viewBox="0 0 1200 12"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          className="cm-sea__horizon-wave-path"
          d="M0 7 Q50 2 100 7 T200 7 T300 7 T400 7 T500 7 T600 7 T700 7 T800 7 T900 7 T1000 7 T1100 7 T1200 7"
          fill="none"
          stroke={night ? 'rgba(160,200,230,0.55)' : 'rgba(220,240,255,0.7)'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
