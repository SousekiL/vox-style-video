import '@fontsource/noto-serif-sc/900.css';
import '@fontsource/noto-sans-sc/400.css';
import '@fontsource/noto-sans-sc/700.css';
import '@fontsource/noto-sans-sc/900.css';
import '@fontsource/noto-serif-jp/700.css';
import '@fontsource/libre-franklin/600.css';
import '@fontsource/libre-franklin/700.css';
import '@fontsource/libre-franklin/800.css';
import 'lxgw-wenkai-webfont/lxgwwenkai-regular.css';
import {continueRender, delayRender} from 'remotion';
import {CHARS} from './chars';
// Extra offline faces for this story (Noto SC + Libre Franklin also come from ../../collage/fonts via Google Fonts).

const SPECS = [
  '900 40px "Noto Serif SC"',
  '400 40px "Noto Sans SC"',
  '700 40px "Noto Sans SC"',
  '900 40px "Noto Sans SC"',
  '700 40px "Noto Serif JP"',
  '600 40px "Libre Franklin"',
  '700 40px "Libre Franklin"',
  '800 40px "Libre Franklin"',
  '400 40px "LXGW WenKai"',
];
if (typeof document !== 'undefined') {
  const h = delayRender('fonts');
  Promise.all(SPECS.map((s) => document.fonts.load(s, CHARS)))
    .then(() => document.fonts.ready)
    .then(() => continueRender(h))
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
}
