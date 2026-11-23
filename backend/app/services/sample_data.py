"""Static sample data for demo workspaces: fictional international B2B accounts."""

# name, domain, industry, employees, country, city, annual revenue, lifecycle
COMPANIES: list[tuple[str, str, str, str, str, str, float, str]] = [
    ("Nimbus Cloud", "nimbuscloud.io", "SaaS", "201–500", "United States", "San Francisco", 48e6, "customer"),
    ("Acme Logistics", "acme-logistics.de", "Logistics", "1,001–5,000", "Germany", "Hamburg", 320e6, "prospect"),
    ("Fjord Energy", "fjordenergy.no", "Energy", "501–1,000", "Norway", "Bergen", 210e6, "prospect"),
    ("Sakura Robotics", "sakura-robotics.jp", "Manufacturing", "1,001–5,000", "Japan", "Osaka", 540e6, "lead"),
    ("Atlas Pharma", "atlaspharma.ch", "Healthcare", "5,000+", "Switzerland", "Basel", 1.2e9, "customer"),
    ("Kestrel Fintech", "kestrel.finance", "Fintech", "51–200", "United Kingdom", "London", 22e6, "prospect"),
    ("Silk Road Trading", "silkroad.uz", "Retail", "201–500", "Uzbekistan", "Tashkent", 35e6, "customer"),
    ("Andes Mining", "andesmining.cl", "Mining", "1,001–5,000", "Chile", "Santiago", 780e6, "lead"),
    ("Lumen Health", "lumenhealth.ca", "Healthcare", "201–500", "Canada", "Toronto", 61e6, "prospect"),
    ("Baltic Freight", "balticfreight.ee", "Logistics", "51–200", "Estonia", "Tallinn", 18e6, "lead"),
    ("Orion Aerospace", "orion-aero.fr", "Aerospace", "5,000+", "France", "Toulouse", 2.4e9, "prospect"),
    ("Cobalt Security", "cobaltsec.io", "Cybersecurity", "51–200", "Israel", "Tel Aviv", 27e6, "customer"),
    ("Harbor Foods", "harborfoods.nl", "Food & Beverage", "501–1,000", "Netherlands", "Rotterdam", 140e6, "churned"),
    ("Vertex Analytics", "vertexanalytics.sg", "SaaS", "11–50", "Singapore", "Singapore", 6.5e6, "lead"),
    ("Monsoon Telecom", "monsoontel.in", "Telecom", "5,000+", "India", "Bengaluru", 950e6, "prospect"),
]

FIRST_NAMES = ["Emma", "Lukas", "Ingrid", "Haruto", "Sofia", "James", "Dilnoza", "Mateo", "Olivia", "Karl",
               "Camille", "Noam", "Daan", "Wei", "Priya", "Aziz", "Clara", "Ethan", "Yuki", "Liam"]
LAST_NAMES = ["Schmidt", "Hansen", "Tanaka", "Rossi", "Walker", "Karimova", "Garcia", "Brown", "Tamm", "Dubois",
              "Levi", "de Vries", "Chen", "Sharma", "Rahimov", "Novak", "Miller", "Sato", "Murphy", "Weber"]
TITLES = ["VP of Sales", "Head of Procurement", "CTO", "COO", "Director of IT", "CFO", "Head of Operations", "Product Lead"]
PRODUCTS = ["Enterprise License", "Platform Rollout", "Pilot Program", "Annual Renewal", "Expansion — 200 seats",
            "Data Integration", "Security Add-on", "Analytics Suite"]
SOURCES = ["Inbound", "Outbound", "Referral", "Partner", "Event", "Website"]
PRIORITIES = ["low", "medium", "medium", "high"]
LOST_REASONS = ["Price too high", "Chose competitor", "No budget", "Bad timing"]

# type, subject, body
ACTIVITIES: list[tuple[str, str, str | None]] = [
    ("call", "Discovery call", "Walked through current stack and pain points. Strong interest in automation."),
    ("email", "Sent pricing proposal", "Shared tiered pricing and ROI one-pager."),
    ("meeting", "Product demo with buying committee", "Demo for 5 stakeholders incl. IT and Finance."),
    ("task", "Follow up on security questionnaire", "Legal needs SOC 2 report and DPA."),
    ("note", "Champion identified", "Our champion is pushing for a quarter-end signature. Budget approved in principle."),
    ("task", "Prepare mutual action plan", "Align on timeline, legal review and go-live date."),
    ("call", "Negotiation call", "Asked for 12% discount on a 3-year term."),
    ("email", "Intro email to procurement", None),
]

# outcome weight list: most B2B dials do not connect.
CALL_OUTCOMES = ["connected", "connected", "connected", "no_answer", "no_answer", "voicemail", "busy", "wrong_number"]

# summary (what was discussed), next steps
CALL_NOTES: list[tuple[str, str]] = [
    ("Confirmed budget for Q1; procurement wants a 3-year price lock.", "Send revised 3-year quote"),
    ("Walked through integration with their ERP. IT lead raised SSO concerns.", "Share SSO / SAML documentation"),
    ("Champion says legal review starts next week. Competitor still in the race.", "Book call with legal"),
    ("Discussed pilot success criteria: 20% faster onboarding, 3 teams.", "Draft pilot success plan"),
    ("CFO asked for ROI breakdown by region.", "Prepare regional ROI model"),
]
