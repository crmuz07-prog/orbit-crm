# Prompt 014 — Superadmin can't sign in with the Render login (401)

> Follows `/CLAUDE.md`. Reported: "renderdagi login parol bilan kirsam ham prodda 401".

## Diagnosis
Both `SUPERADMIN_EMAIL` and `SUPERADMIN_PASSWORD` are set in Render (values not read). The bootstrap only *created* the
account with the env password; an email that already existed was promoted with its old password kept, and values were
used verbatim (a trailing space or newline from copy-paste makes the password different from what is typed).

## Fix
- The env password is the source of truth for the bootstrap superadmin: applied on start-up when it doesn't match,
  also for an existing account; nothing is written when it matches (no churn, no sign-outs on restart).
- Email and password are trimmed; email lower-cased; `must_change_password` cleared; the outcome is logged.

## Acceptance
pytest covers promotion of an existing account with a padded env value and an idempotent restart. After deploy the
Render login works.
