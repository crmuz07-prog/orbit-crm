"""The workbook's own lists, colours and extra columns are used on import (synthetic data only)."""

import base64
import io

from fastapi.testclient import TestClient
from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.styles import PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

from tests.conftest import Headers

HEADER = ["id", "full_name", "phone_number", "telefon_raqamingiz", "Kompaniya", "Sotuv bosqichi", "Hajm", "Paket turi", "Rad etish sababi", "ad_id", "form_id"]
ROWS = [
    ["l:10", "Ali", "p:+998901112233", "90 111 22 99", "Oq Tong MChJ", "Jarayonda", "0–100 kg", "Mayka", "", "ag:555", "f:777"],
    ["l:11", "Vali", "p:+998901112244", "", "oq tong mchj ", "Rad etildi", "100–500 kg", "Reyter", "Narx qimmat", "ag:555", "f:777"],
]


def workbook() -> str:
    book = Workbook()
    sheet = book.active
    for row in [HEADER, *ROWS]:
        sheet.append(row)
    sheet.conditional_formatting.add("G2:G100", FormulaRule(formula=['$G2="0–100 kg"'], fill=PatternFill(fgColor="FFFECACA", bgColor="FFFECACA", fill_type="solid")))
    package = DataValidation(type="list", formula1='"Mayka,Reyter,ZIP,Bopp"')
    sheet.add_data_validation(package)
    package.add("H2:H100")
    lists = book.create_sheet("Списки")
    lists.append(["Sotuv bosqichi", "Izoh", None, "Rad etish sababi"])
    for row in [["Yangi lid", "Hali bog‘lanilmagan", None, "Narx qimmat"], ["Jarayonda", "Muzokara", None, "Boshqa sabab"],
                ["Muvaffaqiyatli sotuv", "Buyurtma tasdiqlangan", None, None], ["Rad etildi", "Mijoz rad etdi", None, None]]:
        lists.append(row)
    out = io.BytesIO()
    book.save(out)
    return base64.b64encode(out.getvalue()).decode()


def test_sheet_lists_colours_companies_and_ids_are_used(client: TestClient, auth: Headers) -> None:
    pid = client.post("/api/pipelines", headers=auth, json={"name": "Paketlar"}).json()["id"]
    content = workbook()
    columns = client.post("/api/import/deals/preview", headers=auth, json={"filename": "s.xlsx", "content": content}).json()["columns"]
    targets = {c["header"]: c["target"] for c in columns}
    assert targets["Kompaniya"] == "company" and targets["telefon_raqamingiz"] == "new_custom"
    assert targets["ad_id"] == "ad_id" and targets["form_id"] == "form_id"
    result = client.post("/api/import/deals", headers=auth, json={"filename": "s.xlsx", "content": content, "pipeline_id": pid, "columns": columns}).json()
    assert result["created"] == 2 and result["companies_created"] == 1

    stages = sorted((s for s in client.get("/api/stages", headers=auth).json() if s["pipeline_id"] == pid), key=lambda s: s["position"])
    names = [s["name"] for s in stages]
    # The sheet's open stages lead the funnel in its order; its won / lost stages are among the closed ones at the end.
    assert names[:2] == ["Yangi lid", "Jarayonda"]
    assert names.index("Muvaffaqiyatli sotuv") < names.index("Rad etildi") and all(s["is_won"] or s["is_lost"] for s in stages[names.index("Muvaffaqiyatli sotuv"):])
    by_name = {s["name"]: s for s in stages}
    assert by_name["Yangi lid"]["description"] == "Hali bog‘lanilmagan" and by_name["Muvaffaqiyatli sotuv"]["is_won"] and by_name["Rad etildi"]["is_lost"]
    assert [r["name"] for r in client.get("/api/lost-reasons", headers=auth).json()] == ["Narx qimmat", "Boshqa sabab"]

    fields = {f["label"]: f for f in client.get("/api/custom-fields", headers=auth).json()}
    assert fields["Hajm"]["warn_options"] == ["0–100 kg"]
    assert fields["Paket turi"]["options"][:4] == ["Mayka", "Reyter", "ZIP", "Bopp"]
    deals = {d["title"]: d for d in client.get("/api/deals", headers=auth).json()}
    assert deals["Ali"]["custom"][fields["telefon raqamingiz"]["key"]] == "90 111 22 99"

    company = next(c for c in client.get("/api/companies", headers=auth).json() if c["name"] == "Oq Tong MChJ")
    assert deals["Ali"]["company_id"] == deals["Vali"]["company_id"] == company["id"]
    source = client.get(f"/api/reports/attribution/{deals['Ali']['id']}", headers=auth).json()
    assert (source["ad_id"], source["form_id"]) == ("555", "777")
    again = client.post("/api/import/deals", headers=auth, json={"filename": "s.xlsx", "content": content, "pipeline_id": pid, "columns": columns}).json()
    assert (again["created"], again["companies_created"]) == (0, 0)


def test_a_company_per_contact_keeps_same_names_apart(client: TestClient, auth: Headers) -> None:
    rows = [["l:20", "Doniyor", "p:+998901000001", "", "", "Jarayonda", "", "", "", "", ""],
            ["l:21", "Doniyor", "p:+998901000002", "", "", "Jarayonda", "", "", "", "", ""]]
    book = Workbook()
    sheet = book.active
    for row in [[h for h in HEADER if h != "Kompaniya"], *[[c for i, c in enumerate(r) if i != 4] for r in rows]]:
        sheet.append(row)
    out = io.BytesIO()
    book.save(out)
    content = base64.b64encode(out.getvalue()).decode()
    pid = client.post("/api/pipelines", headers=auth, json={"name": "Bir martalik"}).json()["id"]
    columns = client.post("/api/import/deals/preview", headers=auth, json={"filename": "p.xlsx", "content": content}).json()["columns"]
    body = {"filename": "p.xlsx", "content": content, "pipeline_id": pid, "columns": columns, "company_per_contact": True}
    assert client.post("/api/import/deals", headers=auth, json=body).json()["companies_created"] == 2
    companies = [c for c in client.get("/api/companies", headers=auth).json() if c["name"] == "Doniyor"]
    assert len(companies) == 2
    again = client.post("/api/import/deals", headers=auth, json=body).json()
    assert again["companies_created"] == 0 and len([c for c in client.get("/api/companies", headers=auth).json() if c["name"] == "Doniyor"]) == 2
