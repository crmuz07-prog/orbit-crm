from sqlalchemy.orm import Session

from app.models import Membership, Stage, User, Workspace

# (name, probability, color, is_won, is_lost) — a classic B2B pipeline.
DEFAULT_STAGES: list[tuple[str, int, str, bool, bool]] = [
    ("Lead In", 10, "slate", False, False),
    ("Qualified", 25, "blue", False, False),
    ("Discovery / Demo", 40, "violet", False, False),
    ("Proposal", 60, "amber", False, False),
    ("Negotiation", 80, "orange", False, False),
    ("Closed Won", 100, "emerald", True, False),
    ("Closed Lost", 0, "rose", False, True),
]


def default_stages(workspace_id: str) -> list[Stage]:
    return [
        Stage(workspace_id=workspace_id, name=name, position=i, probability=p, color=color, is_won=won, is_lost=lost)
        for i, (name, p, color, won, lost) in enumerate(DEFAULT_STAGES)
    ]


def create_workspace(db: Session, owner: User, name: str, is_demo: bool = False) -> Workspace:
    workspace = Workspace(name=name, is_demo=is_demo)
    db.add(workspace)
    db.flush()
    db.add(Membership(workspace_id=workspace.id, user_id=owner.id, role="owner"))
    db.add_all(default_stages(workspace.id))
    db.commit()
    return workspace
