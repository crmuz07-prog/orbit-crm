"""Module × action permissions with own/team/all scope (modelled on erp1 RBAC and HubSpot user permissions).

Owners and admins have full access; a member's permissions come from their access role, resolved per request,
so editing a role applies to everyone holding it immediately.
"""

from dataclasses import dataclass, field
from typing import Any, Literal, get_args

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import Forbidden
from app.models import AccessRole, Membership

Module = Literal["companies", "contacts", "deals", "activities", "reports"]
Action = Literal["view", "create", "edit", "delete", "export"]
Scope = Literal["own", "team", "all"]
MODULES: tuple[Module, ...] = get_args(Module)
ACTIONS: tuple[Action, ...] = get_args(Action)
SCOPES: tuple[Scope, ...] = get_args(Scope)

# Reports are read-only views: only "view" means anything there.
MODULE_ACTIONS: dict[str, tuple[Action, ...]] = {"reports": ("view",)}

ModulePermission = dict[str, Any]
Permissions = dict[str, ModulePermission]


def grant(actions: tuple[Action, ...], scope: Scope) -> ModulePermission:
    return {**{a: a in actions for a in ACTIONS}, "scope": scope}


def uniform(actions: tuple[Action, ...], scope: Scope) -> Permissions:
    return {m: grant(actions, scope) for m in MODULES}


WRITE: tuple[Action, ...] = ("view", "create", "edit")
# Seeded into every workspace (also by migration 0004, which keeps its own copy of these values).
BUILT_IN_ROLES: list[tuple[str, Permissions, bool]] = [
    ("Sales rep", uniform(WRITE, "own"), True),
    ("Team lead", uniform(ACTIONS, "team"), False),
    ("Viewer", uniform(("view",), "all"), False),
]


def normalise(raw: Any) -> Permissions:
    """Drops unknown modules/keys, coerces flags to bool; any granted action implies view (erp1 rule)."""
    result: Permissions = {}
    source = raw if isinstance(raw, dict) else {}
    for module in MODULES:
        entry = source.get(module) if isinstance(source.get(module), dict) else {}
        allowed = MODULE_ACTIONS.get(module, ACTIONS)
        flags = {a: a in allowed and bool(entry.get(a)) for a in ACTIONS}
        flags["view"] = any(flags.values())
        scope = entry.get("scope") if entry.get("scope") in SCOPES else "own"
        result[module] = {**flags, "scope": scope}
    return result


@dataclass(frozen=True)
class Access:
    """What the caller may do in the current workspace."""

    full: bool
    permissions: Permissions = field(default_factory=dict)

    def can(self, module: Module, action: Action) -> bool:
        return self.full or bool(self.permissions.get(module, {}).get(action))

    def scope(self, module: Module) -> Scope:
        return "all" if self.full else self.permissions.get(module, {}).get("scope", "own")

    def require(self, module: Module, action: Action) -> None:
        if not self.can(module, action):
            raise Forbidden(f"You don't have permission to {action} {module}", "permission_denied")

    def as_dict(self) -> Permissions:
        return uniform(ACTIONS, "all") if self.full else self.permissions


def default_role(db: Session, workspace_id: str) -> AccessRole | None:
    return db.scalar(select(AccessRole).where(AccessRole.workspace_id == workspace_id, AccessRole.is_default.is_(True)))


def resolve(db: Session, membership: Membership) -> Access:
    if membership.role in ("owner", "admin"):
        return Access(full=True)
    role = db.get(AccessRole, membership.access_role_id) if membership.access_role_id else None
    role = role or default_role(db, membership.workspace_id)
    # No role at all (should not happen after seeding): read-only on own records, never more.
    return Access(full=False, permissions=normalise(role.permissions if role else uniform(("view",), "own")))


def seed_roles(workspace_id: str) -> list[AccessRole]:
    return [AccessRole(workspace_id=workspace_id, name=n, permissions=p, is_default=d) for n, p, d in BUILT_IN_ROLES]
