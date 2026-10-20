// Original stand-in "photo" objects drawn in SVG with tonal gradients, so treatments (greyscale,
// halftone, duotone) have something to bite on. Replace with real cut-out PNGs from the asset
// pipeline (style/collage-motion/09-assets.md) for production.
import React from 'react';

type P = {width: number; height?: number};

export const HouseObject: React.FC<P & {roof?: string; wall?: string}> = ({width, roof = '#5a5a5a', wall = '#bdbdbd'}) => (
  <svg width={width} height={width * 0.9} viewBox="0 0 200 180">
    <defs>
      <linearGradient id="hw" x1="0" x2="1">
        <stop offset="0" stopColor={wall} />
        <stop offset="1" stopColor="#7d7d7d" />
      </linearGradient>
      <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={roof} />
        <stop offset="1" stopColor="#262626" />
      </linearGradient>
    </defs>
    <rect x="30" y="80" width="140" height="95" fill="url(#hw)" />
    <polygon points="15,85 100,18 185,85" fill="url(#hr)" />
    <rect x="128" y="30" width="18" height="34" fill="#3a3a3a" />
    <rect x="50" y="100" width="34" height="30" fill="#2b2b2b" />
    <rect x="53" y="103" width="13" height="11" fill="#d8d8d8" />
    <rect x="68" y="103" width="13" height="11" fill="#cfcfcf" />
    <rect x="110" y="110" width="34" height="65" fill="#333" />
    <circle cx="137" cy="145" r="2.4" fill="#ddd" />
    <rect x="30" y="170" width="140" height="5" fill="#555" />
  </svg>
);

export const BankObject: React.FC<P> = ({width}) => (
  <svg width={width} height={width * 0.8} viewBox="0 0 220 176">
    <defs>
      <linearGradient id="bs" x1="0" x2="1">
        <stop offset="0" stopColor="#e2e2e2" />
        <stop offset="1" stopColor="#8a8a8a" />
      </linearGradient>
    </defs>
    <polygon points="10,52 110,8 210,52" fill="#6b6b6b" />
    <rect x="18" y="52" width="184" height="12" fill="#9a9a9a" />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <rect key={i} x={30 + i * 30} y={66} width={14} height={84} fill="url(#bs)" />
    ))}
    <rect x="14" y="150" width="192" height="10" fill="#707070" />
    <rect x="6" y="160" width="208" height="14" fill="#4c4c4c" />
  </svg>
);

export const CoinStack: React.FC<P> = ({width}) => (
  <svg width={width} height={width * 1.1} viewBox="0 0 100 110">
    {new Array(7).fill(0).map((_, i) => (
      <g key={i} transform={`translate(${(i % 2) * 3},${90 - i * 11})`}>
        <ellipse cx="48" cy="12" rx="40" ry="10" fill="#4a4a4a" />
        <rect x="8" y="2" width="80" height="10" fill="#8d8d8d" />
        <ellipse cx="48" cy="2" rx="40" ry="10" fill="#d0d0d0" />
        <ellipse cx="48" cy="2" rx="30" ry="7" fill="none" stroke="#9a9a9a" strokeWidth="1.5" />
      </g>
    ))}
  </svg>
);

/** A hand-like reaching shape, greyscale (stand-in for the hand cut-outs used across v01/v03). */
export const HandObject: React.FC<P> = ({width}) => (
  <svg width={width} height={width * 0.55} viewBox="0 0 200 110">
    <defs>
      <linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d6d6d6" />
        <stop offset="1" stopColor="#7a7a7a" />
      </linearGradient>
    </defs>
    <path d="M0,55 C40,40 70,38 95,42 L170,30 C182,28 186,40 174,44 L118,56 L178,58 C190,59 190,72 178,72 L120,72 L168,82 C180,85 176,97 164,95 L110,88 C90,96 60,98 0,92 Z" fill="url(#sk)" />
    <path d="M95,42 L130,34" stroke="#999" strokeWidth="1.5" />
  </svg>
);

/** Sepia "archive" architecture placeholder (tower + facade) for the thenNow preset. */
export const TowerObject: React.FC<P> = ({width}) => (
  <svg width={width} height={width * 0.75} viewBox="0 0 240 180">
    <defs>
      <linearGradient id="tf" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c9b79a" />
        <stop offset="1" stopColor="#6a5a46" />
      </linearGradient>
    </defs>
    <rect x="104" y="10" width="32" height="70" fill="url(#tf)" />
    <polygon points="100,12 120,0 140,12" fill="#5a4a38" />
    <circle cx="120" cy="38" r="9" fill="#e9dcc4" stroke="#5a4a38" strokeWidth="2" />
    <rect x="10" y="78" width="220" height="100" fill="url(#tf)" />
    {new Array(9).fill(0).map((_, i) => (
      <rect key={i} x={22 + i * 24} y={98} width={10} height={24} fill="#4a3c2c" />
    ))}
    {new Array(9).fill(0).map((_, i) => (
      <rect key={`b${i}`} x={22 + i * 24} y={136} width={10} height={24} fill="#4a3c2c" />
    ))}
  </svg>
);
