#!/usr/bin/env bash
# Bootstrap a collage-motion Remotion project.
# Usage: bash ~/.claude/skills/vox-style-video/scripts/new_project.sh <target-dir>
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:?usage: new_project.sh <target-dir>}"
mkdir -p "$TARGET"
if [ -e "$TARGET/src/collage" ]; then
  echo "src/collage already exists in $TARGET; refusing to overwrite. Copy individual files by hand." >&2
  exit 1
fi
cp -R "$SKILL/template/." "$TARGET/"
mkdir -p "$TARGET/scripts/assets" "$TARGET/public/assets/raw" "$TARGET/public/assets/gen" "$TARGET/public/paper" "$TARGET/out"
cp "$SKILL/scripts/prep_reference.py" "$SKILL/scripts/cadence.py" "$TARGET/scripts/"
cp "$SKILL/scripts/assets/"*.py "$SKILL/scripts/assets/cutout.swift" "$TARGET/scripts/assets/"
mkdir -p "$TARGET/scripts/audio" "$TARGET/public/audio/raw"
cp "$SKILL/scripts/audio/"* "$TARGET/scripts/audio/"
if [ ! -f "$HOME/.local/share/soundfonts/GeneralUser-GS.sf2" ]; then
  echo "note: BGM composing needs fluidsynth + the GeneralUser GS soundfont (see references/12-audio.md §5)" >&2
fi
cd "$TARGET"
swiftc -O scripts/assets/cutout.swift -o scripts/assets/cutout
npm install --no-audit --no-fund
npx tsc --noEmit
echo "ready: $TARGET  (npm run studio · npx remotion render src/index.ts ExplainerDemo out/demo.mp4)"
