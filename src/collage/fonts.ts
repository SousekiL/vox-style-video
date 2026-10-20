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
import {continueRender, delayRender, staticFile} from 'remotion';

export const FONT = {
  grotesk: loadInterTight('normal', {weights: ['400', '600', '700'], subsets: ['latin']}).fontFamily, // v01 captions
  heroSerif: loadPlayfair('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily, // v04a cropped headline
  heroSerifItalic: loadPlayfair('italic', {weights: ['700'], subsets: ['latin']}).fontFamily, // v07 "1000"
  titleSerif: loadCormorant('normal', {weights: ['500', '600'], subsets: ['latin']}).fontFamily, // v04b THIS IS, night serif
  meta: loadInter('normal', {weights: ['400', '600'], subsets: ['latin']}).fontFamily, // metadata labels
  quirky: loadSpaceGrotesk('normal', {weights: ['500'], subsets: ['latin']}).fontFamily, // v04a geometric grotesk
  mono: loadRobotoMono('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily, // v05 captions
  hand: loadNothingYouCouldDo('normal', {weights: ['400'], subsets: ['latin']}).fontFamily, // v08 postcard hand
  ransom: loadLibreCaslon('normal', {weights: ['700'], subsets: ['latin']}).fontFamily, // v03 newsprint word
  annotation: loadArchitects('normal', {weights: ['400'], subsets: ['latin']}).fontFamily, // v04a red notes
};

// Vox editorial faces (13-vox-editorial.md §type): Balto → Libre Franklin, Harriet → Libre Baskerville, Roboto Mono.
// CJK: Noto Sans SC / Noto Serif SC from Google Fonts (they load as unicode-range slices; the browser fetches
// only the slices the text uses). For long CJK scripts, self-host a pyftsubset subset instead (§fonts).
export const VOX_FONT = {
  sans: loadLibreFranklin('normal', {weights: ['500', '600', '700', '800'], subsets: ['latin']}).fontFamily,
  serif: loadLibreBaskerville('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
  mono: FONT.mono,
  cjkSans: loadNotoSansSC('normal', {weights: ['400', '500', '700', '900'], subsets: ['chinese-simplified', 'latin'], ignoreTooManyRequestsWarning: true}).fontFamily,
  cjkSerif: loadNotoSerifSC('normal', {weights: ['700', '900'], subsets: ['chinese-simplified', 'latin'], ignoreTooManyRequestsWarning: true}).fontFamily,
  /** 朱雀仿宋 Zhuque Fangsong (OFL): self-hosted subset, see loadLocalFont + scripts/fonts/subset.sh */
  cjkFangsong: 'Zhuque Fangsong',
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
