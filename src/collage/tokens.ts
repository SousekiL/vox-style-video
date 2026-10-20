// Design tokens measured from the reference set (see style/collage-motion/01-color.md).
// Every value here is traceable to a note in references/notes/*.md.

export type Palette = {
  page: string; // outermost ground
  paper: string; // main paper sheet
  ink: string; // type and line work, never pure #000 unless the preset says so
  accent: string; // the ONE saturated colour per frame
  accent2?: string; // held back, or used tiny
  pastels: string[]; // flat semi-transparent shapes (multiply)
  tape?: string;
  photo: PhotoTreatment; // default photo grade
};

export type PhotoTreatment =
  | {kind: 'greyscale'; contrast: number}
  | {kind: 'sepia'; amount: number}
  | {kind: 'duotone'; dark: string; light: string}
  | {kind: 'muted'; saturate: number; sepia: number}
  | {kind: 'halftone'; pitchPctH: number; angle: number};

// One palette per preset. Names match style/collage-motion/07-presets.md.
export const PALETTES = {
  // v01: cool grey paper, pastel flats, single red-orange accent
  explainer: {
    page: '#fdfdfd',
    paper: '#e8e7ea',
    ink: '#161616',
    accent: '#e85f34',
    pastels: ['#dbeed1', '#aed1a4', '#ffdfd2', '#f4a493'],
    tape: '#b8b670',
    photo: {kind: 'greyscale', contrast: 1.25},
  },
  // v04 part A: white editorial page / black night page, red-orange pencil
  archive: {
    page: '#fbfbfb',
    paper: '#ecebdf',
    ink: '#0e0d0d',
    accent: '#e74c1d',
    accent2: '#bc4621', // the same red read on black
    pastels: ['#ebe9db', '#f1efdf'],
    photo: {kind: 'halftone', pitchPctH: 0.74, angle: 45},
  },
  // v03: olive / khaki / cream with one blood-red paper, no white
  earth: {
    page: '#efe6db',
    paper: '#efe6db',
    ink: '#212020',
    accent: '#9e2522',
    pastels: ['#797648', '#c2af91', '#decbb2'],
    photo: {kind: 'muted', saturate: 0.8, sepia: 0.2},
  },
  // v08: teal + cream two-tone, yellow doodles, red-orange held for the payoff
  postcard: {
    page: '#76b7b2',
    paper: '#ecdfc5',
    ink: '#46381f',
    accent: '#f9e961',
    accent2: '#f8510a',
    pastels: ['#f8ebd2', '#96bdb2'],
    photo: {kind: 'sepia', amount: 0.35},
  },
  // v07: plaster paper, sepia architecture, one red object (the "present")
  thenNow: {
    page: '#e6dfd8',
    paper: '#cdc2ba',
    ink: '#222225',
    accent: '#d52943',
    pastels: ['#ccba92', '#f6f7e4'],
    photo: {kind: 'sepia', amount: 0.55},
  },
  // v02: flat warm page, three tiny accents, museum cut-outs
  diorama: {
    page: '#ece9e0',
    paper: '#d4c6b3',
    ink: '#3a3328',
    accent: '#c9913a',
    accent2: '#b82717',
    pastels: ['#47707f', '#d4c6b3'],
    photo: {kind: 'muted', saturate: 0.8, sepia: 0.25},
  },
  // v05: cream + ink + mauve only, smooth and glitchy
  scroll: {
    page: '#e1decf',
    paper: '#bfb8a3',
    ink: '#2f2d2f',
    accent: '#9d8082',
    pastels: ['#b09c9b', '#bfb2ad', '#d8cec0'],
    photo: {kind: 'greyscale', contrast: 1.1},
  },
  // v06: single red field, white + black, greyscale photos
  redIdent: {
    page: '#d8332f',
    paper: '#d8332f',
    ink: '#0d0c0c',
    accent: '#ffffff',
    accent2: '#b01010',
    pastels: [],
    photo: {kind: 'greyscale', contrast: 1.35},
  },
  // v04 part B: red stock paper, duotones, halftone, warm white serif
  duotoneBurst: {
    page: '#000000',
    paper: '#d73d25',
    ink: '#fffff5',
    accent: '#e84b2d',
    accent2: '#20380c',
    pastels: ['#e84c26', '#a55051'],
    photo: {kind: 'duotone', dark: '#5a0d05', light: '#e84b2d'},
  },
} satisfies Record<string, Palette>;

export type PresetName = keyof typeof PALETTES;

// Type scale as % of frame height (measured cap heights converted to font-size).
export const TYPE = {
  heroSerif: 16 * 1.42, // 16 %H cap height, cropped by the top edge (v04a)
  headlineSans: 6.8, // bold neo-grotesk headline (v01)
  captionSans: 11.5, // 2-line presenter caption (v01)
  title: 4.6 * 1.42, // "THIS IS" serif caps (v04b)
  caption: 2.7, // monospace / book caption (v05, v04b)
  metadata: 2.1 * 1.42, // tiny grotesk label/value grid (v04a)
  handwriting: 2.0 * 1.6, // postcard hand (v08)
  numeral: 19.3 * 1.42, // year counter numerals (v05)
};

// Animation clocks seen in the references (frames per second of the drawing, not the comp).
export const CLOCK = {
  explainer: 12, // v01: 2:3 pulldown into 30 fps
  archive: 12.5, // v04a: on 2s at 25 fps
  earth: 10, // v03: 3-3-3-4-2 pattern at 30 fps
  ident: 12, // v06: native 12 fps, texture on 3s/4s
  smooth: Infinity, // v02, v05, v07 text and modern objects
} as const;
