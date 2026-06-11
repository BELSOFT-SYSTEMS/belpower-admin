# Demo mode

Demo mode lets the team review the admin panel with **fake data only** — no real users, transactions, or wallet figures are shown, and admin actions do not call the backend.

Use it for internal demos, design review, and stakeholder walkthroughs.

## Who can toggle it

Only **super admins** see the toggle. It appears on the **dashboard home page** (`/command-center`), on the same line as the welcome message, aligned to the right.

All other admins cannot turn demo mode on or off, but they **do** see demo data when a super admin has enabled it.

## How to use it

1. Sign in as a super admin.
2. Open **Dashboard** (`/command-center`).
3. Turn **Demo mode** **On** (the page reloads).
4. Share the app with reviewers — any admin role can browse every page with sample data.
5. When review is done, sign in as super admin again and turn **Demo mode** **Off**.

While demo mode is on, a **Demo data** banner appears at the top of the admin layout so everyone knows they are not looking at production data.

## What changes in demo mode

| Behavior | In demo mode |
|----------|----------------|
| Data shown | Mock stats, users, transactions, wallet, admins, settings, notifications, etc. |
| Permissions | Bypassed — all roles can access all pages |
| List/detail reads | Served from mock data, not the admin API |
| Buttons & actions | Simulated (toasts/banners); no writes to the backend |
| Polling / refresh | Dashboard and other live refresh loops are skipped where applicable |

## What stays real (login is excluded)

Demo mode does **not** apply to authentication pages or APIs:

- **Sign-in** (`/command-center/sign-in`)
- **Account setup** (`/command-center/setup-account`)
- **Password reset** (`/command-center/reset-password`)

These routes always render immediately (no “Loading command center…” spinner) and always call the **live auth API**. Only after a successful login does demo mode affect the rest of the panel.

- **Session / profile** — your logged-in admin identity is real; only operational data is faked.

## Pages covered

Demo data is wired across the main admin areas, including:

- Dashboard (stats, charts, recent transactions, new users)
- Users (list and detail)
- Transactions (list and detail)
- Wallet
- Admins (list and detail)
- Settings (maintenance toggles — local mock state)
- Service availability
- Notifications
- Check meter
- Inbox notifications (top bar bell)

Action buttons on these pages show demo feedback instead of calling the API.

## How it works technically

- State is stored server-side via `GET` / `POST` `/api/admin/demo-mode`.
- Only super admin JWTs can change the flag (`POST`).
- All signed-in sessions poll the endpoint every ~15 seconds so demo mode stays in sync across admins.
- Toggling on or off triggers a full page reload so every hook picks up the new mode.

Relevant code:

- Toggle UI: `src/components/admin/ui/AdminDemoToggle.tsx`
- Context & sync: `src/context/AdminDemoContext.tsx`, `src/lib/adminDemoMode.ts`
- API route: `src/app/api/admin/demo-mode/route.ts`
- Mock data: `src/data/adminDashboardMock.ts`, `adminListPagesMock.ts`, `adminDetailMocks.ts`, `adminDemoMocks.ts`

## Deployment notes

- Demo mode defaults to **off** unless `ADMIN_DEMO_MODE_DEFAULT=true` is set in the environment.
- On serverless hosts (e.g. Vercel), the toggle state is persisted under the instance temp directory and mirrored in memory. It should work for review sessions; if an instance cold-starts, clients resync from `GET /api/admin/demo-mode`.
- **Turn demo mode off before normal production use** so the panel returns to live data.

## Quick checklist for reviewers

- [ ] Super admin enabled demo mode before the session
- [ ] Blue **Demo data** banner is visible
- [ ] Treat all numbers and names as fictional
- [ ] Super admin disables demo mode after the session
