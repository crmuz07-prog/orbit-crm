.PHONY: install dev api web test build lines check pbx-env pbx-up pbx-down pbx-logs

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

lines:
	./scripts/check-lines.sh

check: lines test build

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
