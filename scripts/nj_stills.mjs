import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// optional: a wrapper Chrome (e.g. one that sets the proxy in the cloud); otherwise Remotion's own
const browserExecutable = process.env.NJ_BROWSER || null;
const secs = process.argv.slice(2).map(Number);
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const composition = await selectComposition({serveUrl, id: 'VoxNanjing1937', browserExecutable});
for (const s of secs) {
  const frame = Math.round(s * 24);
  const output = path.join(root, `out/nj/s${String(s).replace('.', '_')}.jpg`);
  await renderStill({serveUrl, composition, frame, output, imageFormat: 'jpeg', jpegQuality: 85, scale: 0.5, timeoutInMilliseconds: 120000, browserExecutable});
  console.log('ok', s, output);
}
