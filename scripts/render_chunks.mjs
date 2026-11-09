// Render a frame range of a composition to one mp4 (no audio), writing to *.part.mp4 then renaming.
// Cloud: OFFLINE_FONTS=1 skips Google Fonts (see src/collage/fonts.ts).
// usage: OFFLINE_FONTS=1 COMP=VoxTaZi node scripts/render_chunks.mjs <from> <to> out/c0.mp4   (join chunks with ffmpeg concat -c copy)
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
const [a, b, out] = process.argv.slice(2);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), publicDir: path.resolve('public')});
const envVariables = process.env.OFFLINE_FONTS ? {OFFLINE_FONTS: process.env.OFFLINE_FONTS} : {};
const comp = await selectComposition({serveUrl, id: process.env.COMP || 'VoxTaZi', envVariables});
const tmp = out.replace(/\.mp4$/, '.part.mp4');
const t0 = Date.now();
await renderMedia({composition: comp, serveUrl, envVariables, codec: 'h264', crf: 18, x264Preset: 'veryfast', pixelFormat: 'yuv420p', muted: true, frameRange: [Number(a), Number(b)], outputLocation: tmp, concurrency: 2,
  onProgress: ({renderedFrames}) => { if (renderedFrames % 120 === 0) console.log(out, renderedFrames, ((Date.now() - t0) / 1000).toFixed(0) + 's'); }});
fs.renameSync(tmp, out);
console.log('DONE', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
