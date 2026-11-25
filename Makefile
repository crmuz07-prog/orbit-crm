.PHONY: install dev api web test build lines spacing check superadmin pbx-env pbx-up pbx-down pbx-logs

PY := backend/.venv/bin/python

install:
	cd backend && uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements-dev.txt
	cd frontend && npm install

api:
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

web:
	cd frontend && npm run dev

dev:
	$(MAKE) -j2 api web

test:
	cd backend && .venv/bin/python -m pytest -q

build:
	cd frontend && npm run build

# Usage: make superadmin EMAIL=you@company.com (asks for the password)
superadmin:
	cd backend && .venv/bin/python -m app.cli create-superadmin $(EMAIL)

lines:
	./scripts/check-lines.sh

spacing:
	./scripts/check-spacing.sh

check: lines spacing test build

# ───── Local Asterisk test PBX (docs/asterisk-test.md) ─────
PBX := docker compose -f infra/asterisk/docker-compose.yml

pbx-env:
	python3 scripts/pbx-env.py

pbx-up: pbx-env
	$(PBX) up -d --build

pbx-down:
	$(PBX) down

pbx-logs:
	$(PBX) logs -f --tail=100
