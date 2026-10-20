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
