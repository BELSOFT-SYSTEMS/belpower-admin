# Backend: Admin demo mode API

The admin frontend needs a **persistent** demo-mode flag. The previous Next.js-only storage (`/tmp` on Vercel) resets on cold starts, which makes demo mode turn off by itself.

**Status:** Implemented in **belpower-back** — `GET/PATCH /system/demo-mode` (see `services/adminDemoModeService.js`, `controllers/admin/adminDemoModeController.js`, `routes/admin/systemRoutes.js`).

Deploy **belpower-back** for demo mode to persist across Vercel cold starts.

**Base URL:** `https://api.belpower.ng/api/v1/admin`

---

## Storage

Persist a single row/setting, e.g.:

| Field | Type | Notes |
|-------|------|-------|
| `enabled` | `boolean` | Default `false` |
| `updatedAt` | `ISO datetime` | Set on every change |
| `updatedBy` | `string \| null` | Email of super admin who last toggled |

Suggested table: `admin_system_settings` with key `demo_mode`, or a JSON column on an existing system settings record.

**Important:** This must live in the database (or Redis), not in process memory.

---

## `GET /system/demo-mode`

**Auth:** Any authenticated admin (Bearer token required).

**Response**

```json
{
  "success": true,
  "data": {
    "demoMode": {
      "enabled": true,
      "updatedAt": "2026-06-10T14:30:00.000Z",
      "updatedBy": "super@belpower.ng"
    }
  }
}
```

All signed-in admin sessions poll this endpoint every ~15 seconds.

---

## `PATCH /system/demo-mode`

**Auth:** `super_admin` only. Return **403** for other roles.

**Request**

```json
{
  "enabled": true
}
```

**Response**

```json
{
  "success": true,
  "message": "Demo mode updated",
  "data": {
    "state": {
      "enabled": true,
      "updatedAt": "2026-06-10T14:30:00.000Z",
      "updatedBy": "super@belpower.ng"
    }
  }
}
```

Mirror the shape used by `PATCH /system/maintenance` (`data.state` on write, nested object on read).

---

## Frontend behaviour after backend ships

1. Super admin toggles demo mode → frontend calls `PATCH /system/demo-mode` via `/api/admin-proxy`.
2. All admins read state from `GET /system/demo-mode`.
3. The local Next.js route (`/api/admin/demo-mode`) is only used as a **fallback** when this endpoint returns **404**.

Once deployed, demo mode will stay on until a super admin turns it off — including across Vercel deploys and serverless cold starts.

---

## Test checklist (backend)

- [ ] `GET` without token → `401`
- [ ] `GET` with any admin token → returns persisted `enabled`
- [ ] `PATCH` with non–super-admin → `403`
- [ ] `PATCH` with `super_admin` → updates DB and returns new state
- [ ] Value survives API restart / new deployment
- [ ] Default is `enabled: false` on fresh install
