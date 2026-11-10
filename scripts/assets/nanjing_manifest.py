"""Build src/stories/data/nanjing-assets.json from what is in public/evidence/nanjing/ (images are kept local, not in git).
Run after downloading the evidence; the film skips any picture that is missing."""
import json, os, sys
from PIL import Image
root = os.path.join(os.path.dirname(__file__), '..', '..')
d = os.path.join(root, 'public', 'evidence', 'nanjing')
out = {}
for fn in sorted(os.listdir(d)):
    k, ext = os.path.splitext(fn)
    if ext.lower() not in ('.jpg', '.jpeg', '.png', '.webp') or k.startswith('dots_') or k == 'terrain':
        continue
    try:
        w, h = Image.open(os.path.join(d, fn)).size
    except Exception as e:  # half-written download
        print('skip', fn, e, file=sys.stderr)
        continue
    out[k] = {'file': f'evidence/nanjing/{fn}', 'aspect': round(w / h, 4)}
json.dump(out, open(os.path.join(root, 'src', 'stories', 'data', 'nanjing-assets.json'), 'w'), ensure_ascii=False, indent=1)
print(len(out), 'assets:', ' '.join(out))
