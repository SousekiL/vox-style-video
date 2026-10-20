// Shared SVG filter definitions. Render <CollageFilters/> once per composition, then reference the
// filters from CSS: style={{filter: 'url(#torn)'}}. See style/collage-motion/04-textures.md.
import React from 'react';

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
};

/** feComponentTransfer tables mapping black→dark and white→light (a two-ink duotone). */
const DuotoneFilter: React.FC<{id: string; dark: string; light: string}> = ({id, dark, light}) => {
  const [dr, dg, db] = hexToRgb(dark);
  const [lr, lg, lb] = hexToRgb(light);
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      <feColorMatrix type="saturate" values="0" />
      <feComponentTransfer>
        <feFuncR type="table" tableValues={`${dr} ${lr}`} />
        <feFuncG type="table" tableValues={`${dg} ${lg}`} />
        <feFuncB type="table" tableValues={`${db} ${lb}`} />
      </feComponentTransfer>
    </filter>
  );
};

/**
 * @param scale  multiply px values for the render size (1 at 1080p, 2 at 2160p).
 * @param seed   change it to "boil" the rough edges (keep it constant for pixel-still holds).
 */
export const CollageFilters: React.FC<{scale?: number; seed?: number}> = ({scale = 1, seed = 1}) => (
  <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
    <defs>
      {/* Torn / cut paper edge without stroke or shadow (v03, v04a rings). */}
      <filter id="torn" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency={0.018 / scale} numOctaves={3} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={14 * scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* Torn edge with a lighter paper-fibre core showing (v03 note paper, v07 torn strip). */}
      <filter id="tornFibre" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency={0.03 / scale} numOctaves={3} seed={seed} result="n" />
        <feDisplacementMap in="SourceAlpha" in2="n" scale={10 * scale} xChannelSelector="R" yChannelSelector="G" result="edge" />
        <feMorphology in="edge" operator="dilate" radius={2 * scale} result="rim" />
        <feFlood floodColor="#f6f2e6" />
        <feComposite in2="rim" operator="in" result="rimFill" />
        <feComposite in="SourceGraphic" in2="edge" operator="in" result="body" />
        <feMerge>
          <feMergeNode in="rimFill" />
          <feMergeNode in="body" />
        </feMerge>
      </filter>
      {/* Hand-cut white sticker border, 0.4 %H, no shadow (v08 plane/car). */}
      <filter id="sticker" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={5 * scale} result="d" />
        <feTurbulence type="fractalNoise" baseFrequency={0.05 / scale} numOctaves={2} seed={seed} result="n" />
        <feDisplacementMap in="d" in2="n" scale={3 * scale} result="rough" />
        <feFlood floodColor="#f5ecd9" />
        <feComposite in2="rough" operator="in" result="border" />
        <feMerge>
          <feMergeNode in="border" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Torn white sticker border, thick (≈0.8 %H) with a ragged hand-torn edge: vox-collage cut-outs. */}
      <filter id="stickerTorn" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={9 * scale} result="d" />
        <feTurbulence type="fractalNoise" baseFrequency={0.045 / scale} numOctaves={3} seed={7} result="n" />
        <feDisplacementMap in="d" in2="n" scale={10 * scale} xChannelSelector="R" yChannelSelector="G" result="rough" />
        <feFlood floodColor="#F7F4EC" />
        <feComposite in2="rough" operator="in" result="border" />
        <feMerge>
          <feMergeNode in="border" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Cream feathered cut-out halo, 1–1.4 %W (v07 building). */}
      <filter id="halo" x="-10%" y="-10%" width="120%" height="120%">
        <feMorphology in="SourceAlpha" operator="dilate" radius={8 * scale} result="d" />
        <feGaussianBlur in="d" stdDeviation={3 * scale} result="b" />
        <feFlood floodColor="#f6f7e4" />
        <feComposite in2="b" operator="in" result="halo" />
        <feMerge>
          <feMergeNode in="halo" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* 2–3 px RGB fringe on cut-out edges (v04b). */}
      <filter id="fringe" x="-5%" y="-5%" width="110%" height="110%">
        <feOffset in="SourceAlpha" dx={-2.5 * scale} dy={-2.5 * scale} result="a" />
        <feFlood floodColor="#ff1a8c" />
        <feComposite in2="a" operator="in" result="m" />
        <feOffset in="SourceAlpha" dx={2.5 * scale} dy={2.5 * scale} result="b" />
        <feFlood floodColor="#1a2cff" />
        <feComposite in2="b" operator="in" result="c" />
        <feMerge>
          <feMergeNode in="m" />
          <feMergeNode in="c" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Ink-bleed serif: swollen, blobby terminals (v04a "LEAVING A MARK", v04b broken line). */}
      <filter id="inkBleed">
        <feMorphology in="SourceGraphic" operator="dilate" radius={1.2 * scale} result="d" />
        <feTurbulence type="fractalNoise" baseFrequency={0.06 / scale} numOctaves={2} seed={seed} result="n" />
        <feDisplacementMap in="d" in2="n" scale={7 * scale} xChannelSelector="R" yChannelSelector="G" />
        <feGaussianBlur stdDeviation={1.2 * scale} />
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="0 1" />
        </feComponentTransfer>
      </filter>
      {/* Waxy pencil grain for scribbles (v04a red pencil). Apply to strokes. */}
      <filter id="pencil">
        <feTurbulence type="fractalNoise" baseFrequency={0.9 / scale} numOctaves={1} seed={seed} result="g" />
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.5" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>
      {/* Rough crayon edge for doodles (v08 asterisks). */}
      <filter id="crayon">
        <feTurbulence type="fractalNoise" baseFrequency={0.5 / scale} numOctaves={2} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.5 * scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* Highlighter edge (vox): slightly rough marker band, displacement ≈ 0.25 %H */}
      <filter id="markerEdge" x="-5%" y="-20%" width="110%" height="140%">
        <feTurbulence type="fractalNoise" baseFrequency={0.04 / scale} numOctaves={2} seed={3} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={2.7 * scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* Warp boil (v01): re-seeded displacement, mean ≈0.25 %H. Change `seed` every 7–8 frames (busy) or 15 (calm). */}
      <filter id="warp" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency={0.035 / scale} numOctaves={2} seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={5.4 * scale} xChannelSelector="R" yChannelSelector="G" />
      </filter>
      {/* Photo grades */}
      <DuotoneFilter id="duoRed" dark="#5a0d05" light="#e84b2d" />
      <DuotoneFilter id="duoPink" dark="#5a2a2a" light="#f0a090" />
      <DuotoneFilter id="duoGreen" dark="#0e1c06" light="#ffffff" />
      <DuotoneFilter id="duoMaroon" dark="#421d14" light="#eacec7" />
      <DuotoneFilter id="sepiaWarm" dark="#4a3d2c" light="#f8ebd2" />
    </defs>
  </svg>
);
