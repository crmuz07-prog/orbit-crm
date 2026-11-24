"""Excel/CSV import (mapping, dedupe, stages, fields, tasks), custom fields and the lead report. Synthetic data only."""

import base64
import io

from fastapi.testclient import TestClient
from openpyxl import Workbook

from tests.conftest import Headers

HEADER = ["id", "created_time", "campaign_name", "adset_name", "platform", "biznes_turi", "full_name", "phone_number",
          "Sotuv bosqichi", "Menejer", "Hajm", "Rad etish sababi", "Keyingi aloqa sanasi", "Menejer izohi"]
ROWS = [
    ["l:1", "2026-11-13T11:55:14-05:00", "Kampaniya A", "Restoran", "ig", "do'kon_/_supermarket", "Ali", "p:+998901112233",
     "Yangi lid", "Ozod", "0–100 kg", "", "2026-12-01", "qayta qo'ng'iroq"],
    ["l:2", "2026-11-14T09:00:00-05:00", "Kampaniya A", "Restoran", "fb", "boshqa", "Vali", "p:901112244",
     "Rad etildi", "", "100–500 kg", "Narx qimmat", "", ""],
    ["l:3", "2026-11-14T10:00:00-05:00", "Kampaniya B", "Adv+", "ig", "boshqa", "<test lead: dummy data for full_name>", "p:1",
     "Yangi lid", "", "", "", "", ""],
]


def xlsx(rows: list[list[str]]) -> str:
    book = Workbook()
    sheet = book.active
    for row in [HEADER, *rows]:
        sheet.append(row)
    out = io.BytesIO()
    book.save(out)
    return base64.b64encode(out.getvalue()).decode()


def pipeline(client: TestClient, auth: Headers) -> str:
    return client.post("/api/pipelines", headers=auth, json={"name": "Paketlar"}).json()["id"]


def run_import(client: TestClient, auth: Headers, pipeline_id: str, rows: list[list[str]]) -> dict:
    content = xlsx(rows)
    preview = client.post("/api/import/deals/preview", headers=auth, json={"filename": "leads.xlsx", "content": content})
    assert preview.status_code == 200, preview.text
    columns = preview.json()["columns"]
    payload = {"filename": "leads.xlsx", "content": content, "pipeline_id": pipeline_id, "columns": columns}
    result = client.post("/api/import/deals", headers=auth, json=payload)
    assert result.status_code == 200, result.text
    return {"preview": preview.json(), **result.json()}


def test_preview_suggests_meta_columns(client: TestClient, auth: Headers) -> None:
    targets = {c["header"]: c["target"] for c in run_import(client, auth, pipeline(client, auth), ROWS[:1])["preview"]["columns"]}
    assert targets["id"] == "external_id" and targets["phone_number"] == "phone" and targets["full_name"] == "contact_name"
    assert targets["Sotuv bosqichi"] == "stage" and targets["Menejer"] == "owner" and targets["Menejer izohi"] == "note"
    assert targets["biznes_turi"] == "new_custom" and targets["Keyingi aloqa sanasi"] == "next_contact"


def test_import_creates_deals_stages_fields_and_tasks_and_reimport_updates(client: TestClient, auth: Headers, add_member) -> None:
    add_member("ozod@acme.com")
    pid = pipeline(client, auth)
    first = run_import(client, auth, pid, ROWS)
    assert (first["created"], first["skipped"], first["tasks_created"]) == (2, 1, 1)
    assert "Rad etildi" in first["stages_created"] and first["unmatched_owners"] == []
    stages = {s["name"]: s for s in client.get("/api/stages", headers=auth).json() if s["pipeline_id"] == pid}
    assert stages["Rad etildi"]["is_lost"] is True
    deals = {d["title"]: d for d in client.get("/api/deals", headers=auth).json()}
    fields = {f["label"]: f for f in client.get("/api/custom-fields", headers=auth).json()}
    business = fields["biznes turi"]
    assert deals["Ali"]["custom"][business["key"]] == "do'kon / supermarket" and "boshqa" in business["options"]
    assert deals["Vali"]["lost_reason"] == "Narx qimmat"
    assert [r["name"] for r in client.get("/api/lost-reasons", headers=auth).json()] == ["Narx qimmat"]
    contacts = {c["first_name"]: c for c in client.get("/api/contacts", headers=auth).json()}
    assert contacts["Vali"]["phone"] == "+998901112244"
    tasks = [a for a in client.get("/api/activities", headers=auth).json() if a["deal_id"] == deals["Ali"]["id"] and not a["done"]]
    assert len(tasks) == 1 and tasks[0]["type"] == "task" and tasks[0]["due_at"].startswith("2026-12-01T05:00")  # 10:00 Tashkent

    again = run_import(client, auth, pid, ROWS)
    assert (again["created"], again["updated"], again["tasks_created"]) == (0, 2, 0)
    assert len(client.get("/api/deals", headers=auth).json()) == len(deals)


def test_custom_values_are_cleaned_and_logged(client: TestClient, auth: Headers) -> None:
    field = client.post("/api/custom-fields", headers=auth, json={"label": "Hajm (kg)", "type": "number"}).json()
    assert field["key"] == "hajm_kg"
    stage = client.get("/api/stages", headers=auth).json()[0]
    deal = client.post("/api/deals", headers=auth, json={"title": "Paket", "stage_id": stage["id"]}).json()
    saved = client.patch(f"/api/deals/{deal['id']}", headers=auth, json={"custom": {"hajm_kg": "250", "unknown": "x"}}).json()
    assert saved["custom"] == {"hajm_kg": 250.0}
    events = client.get(f"/api/events?deal_id={deal['id']}", headers=auth).json()
    assert any(c["field"] == "custom.hajm_kg" for e in events if e["kind"] == "updated" for c in e["changes"])


def test_report_counts_by_stage_source_field_and_owner(client: TestClient, auth: Headers) -> None:
    pid = pipeline(client, auth)
    run_import(client, auth, pid, ROWS)
    volume = next(f for f in client.get("/api/custom-fields", headers=auth).json() if f["label"] == "Hajm")
    client.patch(f"/api/custom-fields/{volume['id']}", headers=auth, json={"warn_options": ["0–100 kg"]})
    report = client.get(f"/api/reports/leads?pipeline_id={pid}&date_from=2026-11-01&date_to=2026-11-30", headers=auth).json()
    assert report["totals"]["total"] == 2 and report["totals"]["lost"] == 1 and report["totals"]["warnings"] == 1
    by = {b["key"]: {r["label"]: r for r in b["rows"]} for b in report["breakdowns"]}
    assert by["platform"]["instagram"]["total"] == 1 and by["campaign"]["Kampaniya A"]["total"] == 2
    assert by["lost_reason"]["Narx qimmat"]["lost"] == 1
    assert client.get(f"/api/reports/leads?pipeline_id={pid}&date_from=2026-12-01&date_to=2026-12-31", headers=auth).json()["totals"]["total"] == 0


def test_import_is_admin_only(client: TestClient, auth: Headers, add_member) -> None:
    rep = add_member("rep2@acme.com")
    body = {"filename": "leads.xlsx", "content": xlsx(ROWS)}
    assert client.post("/api/import/deals/preview", headers=rep, json=body).status_code == 403
