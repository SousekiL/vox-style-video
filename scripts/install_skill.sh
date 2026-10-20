#!/usr/bin/env bash
# Build the Claude Code skill `vox-style-video` from this repo (the repo is the single source of truth).
# Usage: bash scripts/install_skill.sh [skills-dir]   (default: ~/.claude/skills)
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-$HOME/.claude/skills}/vox-style-video"
rm -rf "$DEST"
mkdir -p "$DEST/references/notes" "$DEST/scripts/assets" "$DEST/template/src" "$DEST/template/public"

cp "$REPO/skill/SKILL.md" "$DEST/SKILL.md"
cp "$REPO/skill/new_project.sh" "$DEST/scripts/new_project.sh"
chmod +x "$DEST/scripts/new_project.sh"

for f in "$REPO"/style/collage-motion/*.md; do
  name="$(basename "$f")"
  [ "$name" = "README.md" ] && name="00-index.md"
  cp "$f" "$DEST/references/$name"
done
cp "$REPO"/references/notes/*.md "$DEST/references/notes/"
cp "$REPO/references/analysis/BRIEF.md" "$DEST/references/notes/ANALYSIS-BRIEF.md"

cp "$REPO/scripts/prep_reference.py" "$REPO/scripts/cadence.py" "$DEST/scripts/"
cp "$REPO"/scripts/assets/*.py "$REPO/scripts/assets/cutout.swift" "$DEST/scripts/assets/"
mkdir -p "$DEST/scripts/audio" "$DEST/template/public/audio"
cp "$REPO"/scripts/audio/*.py "$REPO"/scripts/audio/*.mjs "$DEST/scripts/audio/"
cp -R "$REPO/public/audio/bgm" "$REPO/public/audio/sfx" "$DEST/template/public/audio/"

cp -R "$REPO/src/collage" "$REPO/src/demo" "$REPO/src/stories" "$DEST/template/src/"
cp "$REPO/src/Root.tsx" "$REPO/src/index.ts" "$DEST/template/src/"
cp -R "$REPO/public/cutouts" "$REPO/public/evidence" "$REPO/public/fonts" "$DEST/template/public/"
cp "$REPO/package.json" "$REPO/tsconfig.json" "$DEST/template/"
cp "$REPO/skill/template.gitignore" "$DEST/template/.gitignore"

echo "installed $DEST"
