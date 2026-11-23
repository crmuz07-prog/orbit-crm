# Prompt 006 — Remove the AI "sparkles" icon; flag-only language switcher

- Remove the star/sparkles icon from the UI (login "Explore the demo" button).
- Language switchers (top bar, login, Settings) show **only flags** — no text, no extra icons, no labels or checkmarks.
  The active language is shown by the trigger flag / a subtle highlight; accessibility names stay via `aria-label`.
- Flags are inline SVG (emoji flags render as letters on Windows): Uzbekistan, Russia, United Kingdom.
- Reusable `Flag` component, ≤ 250 lines per file, `make check` green.
