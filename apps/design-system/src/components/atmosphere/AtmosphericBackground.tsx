'use client';

import * as React from 'react';

/**
 * Illustration — not a token surface.
 * High-key powder-blue atmosphere from the light grain reference.
 */
export function AtmosphericBackground() {
  const id = React.useId().replace(/:/g, '');
  const cloudWarp = `${id}-cloudWarp`;
  const cloudLight = `${id}-cloudLight`;
  const waveWarp = `${id}-waveWarp`;
  const waveLight = `${id}-waveLight`;

  return (
    <div className="atmospheric-background" aria-hidden>
      <div className="atmospheric-background__base" />

      <div className="atmospheric-background__clouds">
        <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
          <defs>
            <filter id={cloudWarp}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.004 0.018"
                numOctaves={4}
                seed={17}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={110}
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation={28} />
            </filter>
            <radialGradient id={cloudLight}>
              <stop offset="0%" stopColor="#8eb4d6" stopOpacity="0.38" />
              <stop offset="28%" stopColor="#b4d0e6" stopOpacity="0.22" />
              <stop offset="58%" stopColor="#d7e6f2" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f5f8fc" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse
            cx="820"
            cy="150"
            rx="430"
            ry="210"
            fill={`url(#${cloudLight})`}
            filter={`url(#${cloudWarp})`}
          />
          <ellipse
            cx="570"
            cy="330"
            rx="390"
            ry="180"
            fill={`url(#${cloudLight})`}
            opacity="0.65"
            filter={`url(#${cloudWarp})`}
          />
          <ellipse
            cx="270"
            cy="510"
            rx="330"
            ry="150"
            fill={`url(#${cloudLight})`}
            opacity="0.3"
            filter={`url(#${cloudWarp})`}
          />
        </svg>
      </div>

      <div className="atmospheric-background__waves">
        <svg viewBox="0 0 1200 700" preserveAspectRatio="none">
          <defs>
            <filter id={waveWarp}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.009 0.045"
                numOctaves={3}
                seed={31}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale={85}
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation={8} />
            </filter>
            <linearGradient id={waveLight} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9ec0dc" stopOpacity="0" />
              <stop offset="35%" stopColor="#9ec0dc" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#7fa9cc" stopOpacity="0.22" />
              <stop offset="75%" stopColor="#c5d9ea" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f5f8fc" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M -100 260 C 120 180, 250 350, 470 250 S 820 130, 1320 260 L 1320 430 C 1040 330, 850 430, 620 350 S 180 450, -100 360 Z"
            fill={`url(#${waveLight})`}
            filter={`url(#${waveWarp})`}
          />
          <path
            d="M -100 430 C 150 350, 300 520, 520 430 S 850 300, 1320 420 L 1320 570 C 1000 500, 800 610, 560 500 S 180 570, -100 520 Z"
            fill={`url(#${waveLight})`}
            opacity="0.55"
            filter={`url(#${waveWarp})`}
          />
        </svg>
      </div>

      <div className="atmospheric-background__dark" />
      <div className="atmospheric-background__light" />
      <div className="atmospheric-background__flow" />
      <div className="atmospheric-background__vignette" />
      <div className="atmospheric-background__grain" />
      <div className="atmospheric-background__micro" />
    </div>
  );
}
