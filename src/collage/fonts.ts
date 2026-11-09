// Closest free Google Fonts for each type role found in the references (02-typography.md).
import {loadFont as loadInterTight} from '@remotion/google-fonts/InterTight';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';
import {loadFont as loadCormorant} from '@remotion/google-fonts/CormorantGaramond';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadSpaceGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadRobotoMono} from '@remotion/google-fonts/RobotoMono';
import {loadFont as loadNothingYouCouldDo} from '@remotion/google-fonts/NothingYouCouldDo';
import {loadFont as loadLibreCaslon} from '@remotion/google-fonts/LibreCaslonText';
import {loadFont as loadArchitects} from '@remotion/google-fonts/ArchitectsDaughter';
import {loadFont as loadLibreFranklin} from '@remotion/google-fonts/LibreFranklin';
import {loadFont as loadLibreBaskerville} from '@remotion/google-fonts/LibreBaskerville';
import {loadFont as loadNotoSansSC} from '@remotion/google-fonts/NotoSansSC';
import {loadFont as loadNotoSerifSC} from '@remotion/google-fonts/NotoSerifSC';
import {loadFont as loadNotoSansTC} from '@remotion/google-fonts/NotoSansTC';
import {loadFont as loadNotoSerifTC} from '@remotion/google-fonts/NotoSerifTC';
import {loadFont as loadWenKaiTC} from '@remotion/google-fonts/LXGWWenKaiTC';
import {continueRender, delayRender, staticFile} from 'remotion';

// Cloud renders (headless Chrome without a proxy) cannot reach Google Fonts. Render with
// envVariables {OFFLINE_FONTS: '1'} to skip the Google loads and use the family names only;
// the story must then load those faces itself (e.g. src/stories/tazi/fonts.ts with @fontsource).
const OFFLINE_FONTS = typeof process !== 'undefined' && process.env && process.env.OFFLINE_FONTS === '1';
const gf = (load: () => {fontFamily: string}, family: string) => (OFFLINE_FONTS ? family : load().fontFamily);


export const FONT = {
  grotesk: gf(() => loadInterTight('normal', {weights: ['400', '600', '700'], subsets: ['latin']}), 'Inter Tight'), // v01 captions
  heroSerif: gf(() => loadPlayfair('normal', {weights: ['400', '700'], subsets: ['latin']}), 'Playfair Display'), // v04a cropped headline
  heroSerifItalic: gf(() => loadPlayfair('italic', {weights: ['700'], subsets: ['latin']}), 'Playfair Display'), // v07 "1000"
  titleSerif: gf(() => loadCormorant('normal', {weights: ['500', '600'], subsets: ['latin']}), 'Cormorant Garamond'), // v04b THIS IS, night serif
  meta: gf(() => loadInter('normal', {weights: ['400', '600'], subsets: ['latin']}), 'Inter'), // metadata labels
  quirky: gf(() => loadSpaceGrotesk('normal', {weights: ['500'], subsets: ['latin']}), 'Space Grotesk'), // v04a geometric grotesk
  mono: gf(() => loadRobotoMono('normal', {weights: ['400', '700'], subsets: ['latin']}), 'Roboto Mono'), // v05 captions
  hand: gf(() => loadNothingYouCouldDo('normal', {weights: ['400'], subsets: ['latin']}), 'Nothing You Could Do'), // v08 postcard hand
  ransom: gf(() => loadLibreCaslon('normal', {weights: ['700'], subsets: ['latin']}), 'Libre Caslon Text'), // v03 newsprint word
  annotation: gf(() => loadArchitects('normal', {weights: ['400'], subsets: ['latin']}), 'Architects Daughter'), // v04a red notes
};

// Vox editorial faces (13-vox-editorial.md §type): Balto → Libre Franklin, Harriet → Libre Baskerville, Roboto Mono.
// CJK: Noto Sans SC / Noto Serif SC from Google Fonts (they load as unicode-range slices; the browser fetches
// only the slices the text uses). For long CJK scripts, self-host a pyftsubset subset instead (§fonts).
export const VOX_FONT = {
  sans: gf(() => loadLibreFranklin('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin']}), 'Libre Franklin'),
  serif: gf(() => loadLibreBaskerville('normal', {weights: ['400', '700'], subsets: ['latin']}), 'Libre Baskerville'),
  mono: FONT.mono,
  cjkSans: gf(() => loadNotoSansSC('normal', {weights: ['400', '500', '700', '900'], subsets: ['chinese-simplified', 'latin'], ignoreTooManyRequestsWarning: true}), 'Noto Sans SC'),
  cjkSerif: gf(() => loadNotoSerifSC('normal', {weights: ['700', '900'], subsets: ['chinese-simplified', 'latin'], ignoreTooManyRequestsWarning: true}), 'Noto Serif SC'),
  /** 朱雀仿宋 Zhuque Fangsong (OFL): self-hosted subset, see loadLocalFont + scripts/fonts/subset.sh */
  cjkFangsong: 'Zhuque Fangsong',
};

// Traditional Chinese (Taiwan glyph forms): use these for 繁體 films instead of the SC faces.
export const VOX_FONT_TC = {
  sans: gf(() => loadNotoSansTC('normal', {weights: ['400', '500', '700', '900'], subsets: ['chinese-traditional', 'latin'], ignoreTooManyRequestsWarning: true}), 'Noto Sans TC'),
  serif: gf(() => loadNotoSerifTC('normal', {weights: ['900'], subsets: ['chinese-traditional', 'latin'], ignoreTooManyRequestsWarning: true}), 'Noto Serif TC'),
  kai: gf(() => loadWenKaiTC('normal', {weights: ['700'], subsets: ['chinese-traditional', 'latin'], ignoreTooManyRequestsWarning: true}), 'LXGW WenKai TC'), // 霞鶩文楷 TC (OFL)
};

/** Load a self-hosted font file from public/ (e.g. a pyftsubset .woff/.woff2) and block rendering until ready. */
export const loadLocalFont = (family: string, file: string, weight = '400') => {
  if (typeof document === 'undefined') return family;
  const handle = delayRender(`font ${family}`);
  const fmt = file.endsWith('.woff2') ? 'woff2' : file.endsWith('.woff') ? 'woff' : file.endsWith('.otf') ? 'opentype' : 'truetype';
  const face = new FontFace(family, `url(${staticFile(file)}) format('${fmt}')`, {weight});
  face
    .load()
    .then((f) => {
      (document.fonts as unknown as {add: (font: FontFace) => void}).add(f);
      continueRender(handle);
    })
    .catch((e) => {
      console.error(e);
      continueRender(handle);
    });
  return family;
};
