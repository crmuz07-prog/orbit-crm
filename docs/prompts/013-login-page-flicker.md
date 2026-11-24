# Prompt 013 — Login page changes shape after a refresh (production)

> Follows `/CLAUDE.md`. Reported: "refresh qilinganda boshqa loginni ochib keyin tezda yana boshqasini ochyapti".

## Diagnosis
- The demo button rendered while `/auth/config` was still loading (`demo_enabled !== false`), so a sleeping free-tier API
  (up to ~50 s) showed the old "demo + sign in" page first, then the closed one without the demo.
- The sign-in password field had `minLength={8}`, so shorter admin-issued or operator passwords could not be submitted.

## Fix
- `features/auth/useAuthConfig.ts`: cached config (localStorage) renders immediately; with nothing known yet, optional
  parts (demo, sign-up, forgot password) stay hidden.
- Password length is enforced only when choosing a new password (sign-up).

## Acceptance
`make check` green; the login page renders one stable layout on refresh, cold or warm.
