#!/usr/bin/env bash
# Keeps the UI on one spacing scale (see CLAUDE.md → Spacing): fails on padding / margin / gap utilities beyond it,
# outside the files listed in scripts/spacing-allow.txt. Run by `make check`.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 - <<'PY'
import pathlib, re, sys
root = pathlib.Path('.')
allow = [l.strip() for l in open('scripts/spacing-allow.txt') if l.strip() and not l.startswith('#')]
big = r'([4-9]|1\d|20)'
rules = {
    'px': r'px-([5-9]|1\d)', 'py': r'py-' + big, 'p': r'p-([5-9]|1\d)', 'gap': r'gap-(?:[xy]-)?' + big,
    'space': r'space-[xy]-' + big, 'pt/pb': r'p[tb]-' + big, 'mt/mb': r'm[tb]-([5-9]|1\d)', 'mx/my': r'm[xy]-' + big,
}
pattern = re.compile(r'(?<![\w\-\[/])(?:[a-z0-9]+:)*-?(' + '|'.join(rules.values()) + r')(?![\w.\-\]])')
bad = []
for f in sorted((root / 'frontend/src').rglob('*.tsx')):
    rel = str(f)
    if any(rel.startswith(a) for a in allow):
        continue
    for n, line in enumerate(f.read_text().splitlines(), 1):
        for m in pattern.finditer(line):
            bad.append(f'{rel}:{n}: {m.group(0)}')
if bad:
    print('✗ Spacing outside the scale (use px-4 / py-3 / gap-3 / space-y-3 … or allow-list the file):')
    print('\n'.join('  ' + b for b in bad))
    sys.exit(1)
print('✓ Spacing stays on the scale')
PY
