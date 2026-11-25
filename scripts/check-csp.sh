#!/usr/bin/env bash
# The web app's CSP allows inline scripts by hash; if index.html's inline script changes, the hash in vercel.json must too
# (otherwise production silently blocks it). Run after `npm run build` (part of `make check`).
set -euo pipefail
cd "$(dirname "$0")/../frontend"
python3 - <<'PY'
import base64, hashlib, json, re, sys
html = open('dist/index.html').read()
csp = next(h['value'] for rule in json.load(open('vercel.json'))['headers'] for h in rule['headers'] if h['key'] == 'Content-Security-Policy')
missing = []
for script in re.findall(r'<script>(.*?)</script>', html, re.S):
    digest = 'sha256-' + base64.b64encode(hashlib.sha256(script.encode()).digest()).decode()
    if digest not in csp:
        missing.append(digest)
if missing:
    print("✗ vercel.json CSP misses the inline script hash(es): " + ", ".join(missing))
    sys.exit(1)
print("✓ CSP covers every inline script")
PY
