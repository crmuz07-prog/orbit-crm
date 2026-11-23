#!/usr/bin/env bash
# Fails if any source file exceeds the 250-line limit from CLAUDE.md.
set -euo pipefail
LIMIT=${LIMIT:-250}
cd "$(dirname "$0")/.."

over=$(find frontend/src backend/app backend/tests infra scripts -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.py' -o -name '*.css' \) \
  -exec wc -l {} + | awk -v limit="$LIMIT" '$2 != "total" && $1 > limit { print "  " $1 "  " $2 }')

if [[ -n "$over" ]]; then
  echo "Files over $LIMIT lines:"
  echo "$over"
  exit 1
fi
echo "✓ All source files are within $LIMIT lines"
