# Admin API — Backend Summary & Frontend Guide

**Base URL:** `https://api.belpower.ng/api/v1/admin`  
(Also mounted at `/api/admin` — prefer `/api/v1/admin`.)

**Auth header (protected routes):**

```http
Authorization: Bearer <token>
```

**Roles:** `super_admin` | `admin` | `support` | `content_manager` | `finance`

**Session rule:** JWT alone is not enough. Login/OTP must create an `admin_sessions` row. Token lifetime is **8 hours**. On **401**, clear storage and send the user to login.

---

## What we built (backend)

| Area | What changed |
|------|----------------|
| **RBAC** | Fixed `ROLES` constants; role checks use string roles (`super_admin`, etc.). |
| **Profile** | `GET /profile/me`; `GET /profile/:id` for `super_admin` + `admin` (admin cannot see `super_admin` / `finance` → **404**). |
| **Admin list** | `GET /all` for `super_admin` + `admin`; admin list hides `super_admin` and `finance`. |
| **Create admins** | `POST /register`, `POST /setup-account`, `POST /complete-setup`; admin can only create `support` / `content_manager`. |
| **Password reset** | Request (protected) + complete (public); audit logs; sessions revoked on reset. |
| **Login** | 2FA OTP creates `AdminSession`; `last_login` fixed. |
| **Sessions** | `/sessions/admins` vs `/sessions/users` (staff vs customers). |
| **Disco** | Manual check calls `checkDiscoStatus()`. |
| **Demo mode** | **Frontend ready** — needs `GET/PATCH /system/demo-mode` (see `BACKEND_DEMO_MODE.md`). |
| **Schema tool** | `node scripts/check-admin-schema.js` |

---

## Frontend conventions

```javascript
const API = 'https://api.belpower.ng/api/v1/admin';

function authHeaders() {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function adminFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...options.headers },
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || 'Request failed');
  }
  return data;
}
```

**After login**, store:

```javascript
localStorage.setItem('adminToken', data.data.token);
// Login without 2FA uses data.data.user; OTP uses data.data.admin
const profile = data.data.user || data.data.admin;
localStorage.setItem('admin', JSON.stringify(profile));
```

---

## 1. Authentication (public)

### `POST /login`

**Request**

```json
{
  "email": "admin@belpower.ng",
  "password": "yourPassword"
}
```

**Response — no 2FA**

```json
{
  "success": true,
  "message": "Admin login successful",
  "data": {
    "token": "eyJhbG...",
    "user": {
      "id": "uuid",
      "email": "admin@belpower.ng",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "admin",
      "permissions": []
    }
  }
}
```

**Response — 2FA required**

```json
{
  "success": true,
  "message": "Password verified. OTP sent to your email for 2FA verification",
  "requiresOTP": true,
  "data": {
    "email": "admin@belpower.ng",
    "expiresAt": "2026-06-03T16:00:00.000Z",
    "adminId": "uuid"
  }
}
```

Then call verify-OTP (below). Pending accounts get an error with `requiresSetup: true` — redirect to complete-setup page.

---

### `POST /login/verify-otp`

**Request**

```json
{
  "email": "admin@belpower.ng",
  "otp": "123456"
}
```

**Response**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbG...",
    "admin": {
      "id": "uuid",
      "email": "admin@belpower.ng",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "admin",
      "permissions": []
    }
  }
}
```

---

## 2. Account setup & password (public)

### `POST /complete-setup` (invite email link)

**Request**

```json
{
  "token": "hex-from-email-url",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response**

```json
{
  "success": true,
  "message": "Account setup complete. You can now log in.",
  "data": {
    "email": "newadmin@belpower.ng"
  }
}
```

Frontend: page `/admin/setup-account?token=...` → form → this endpoint → redirect to login.

---

### `POST /reset-password` (reset email link)

**Request**

```json
{
  "token": "jwt-from-email-url",
  "newPassword": "NewSecure123",
  "confirmPassword": "NewSecure123"
}
```

**Response** (shape from helper; always check `success`)

```json
{
  "success": true,
  "status": "success",
  "message": "Operation successful",
  "data": {
    "message": "Password has been reset successfully. You can now log in.",
    "email": "admin@belpower.ng"
  }
}
```

Rules: min **8** chars; passwords must match; token **24h**; all sessions revoked.

---

## 3. Password reset request (protected)

### `POST /password-reset-request`

| Requester | Can reset |
|-----------|-----------|
| `super_admin` | Any admin (including self) |
| `admin` | `support`, `content_manager` only |

**Request**

```json
{
  "email": "support.user@belpower.ng"
}
```

**Response**

```json
{
  "success": true,
  "status": "success",
  "message": "Operation successful",
  "data": {
    "message": "If an admin with this email exists, a password reset link has been sent",
    "resetToken": "only-in-development"
  }
}
```

Target gets email: `{ADMIN_BASE_URL}/reset-password?token=...`

---

## 4. Profile (protected)

### `GET /profile/me` — all roles

**Response**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "admin@belpower.ng",
    "role": "admin",
    "status": "active",
    "phoneNumber": "+2348000000000",
    "profileImage": null,
    "permissions": [],
    "lastLogin": "2026-06-03T10:00:00.000Z",
    "emailVerified": true,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-06-03T15:00:00.000Z"
  }
}
```

---

### `GET /profile/:admin_id` — `super_admin` + `admin`

| Viewer | Can view target roles |
|--------|------------------------|
| `super_admin` | All |
| `admin` | `admin`, `support`, `content_manager` only |
| | Not `super_admin` or `finance` → **404** |

**Response** — same `data` shape as `/profile/me`.

```javascript
// admin user: don't offer finance/super_admin in UI; handle 404 gracefully
const profile = await adminFetch(`/profile/${adminId}`);
```

---

### `PUT /profile/update/:admin_id` — `super_admin` only

**Request** (snake_case)

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "admin@belpower.ng",
  "role": "support",
  "status": "active",
  "phone_number": "+2348000000000",
  "profile_image": "https://...",
  "permissions": []
}
```

**Response** — camelCase `data` (same fields as profile/me).

---

### `DELETE /profile/delete` — `super_admin` only

Soft-deletes all admins except `super_admin`.

**Response**

```json
{
  "success": true,
  "message": "5 admin(s) deleted successfully",
  "data": {
    "deletedCount": 5
  }
}
```

---

### `DELETE /profile/delete/:admin_id` — `super_admin` only

Soft delete (`status: inactive`). Cannot delete self or another `super_admin`.

**Response**

```json
{
  "success": true,
  "message": "Admin deleted successfully",
  "data": {
    "deletedAdmin": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "John Doe"
    }
  }
}
```

**Prefer this** over `DELETE /:id` (hard delete).

---

## 5. Admin management (protected)

### `GET /all` — `super_admin` + `admin`

**Query:** `?page=1&limit=10&search=john`

| Viewer | List includes |
|--------|----------------|
| `super_admin` | Everyone |
| `admin` | `admin`, `support`, `content_manager` only |

**Response** (list uses **snake_case**)

```json
{
  "success": true,
  "total": 25,
  "page": 1,
  "totalPages": 3,
  "admins": [
    {
      "id": "uuid",
      "email": "support@belpower.ng",
      "first_name": "John",
      "last_name": "Doe",
      "role": "support",
      "status": "active",
      "phone_number": "+234...",
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-06-03T15:00:00.000Z"
    }
  ]
}
```

```javascript
const { admins, total, page, totalPages } = await adminFetch('/all?page=1&limit=10');
```

---

### `POST /register` — `super_admin` + `admin`

**Request**

```json
{
  "email": "new@belpower.ng",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "support",
  "phone_number": "+2348000000000"
}
```

| Creator | Allowed `role` |
|---------|----------------|
| `super_admin` | Any |
| `admin` | `support`, `content_manager` only |

Optional `password` → immediate active account (**super_admin** only).

**Response — pending (email sent)**

```json
{
  "success": true,
  "message": "Admin created successfully. Setup email sent.",
  "admin": {
    "id": "uuid",
    "email": "new@belpower.ng",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "support",
    "status": "pending",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

### `POST /setup-account` — `super_admin` only

**Request**

```json
{
  "email": "new@belpower.ng",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "support",
  "phone_number": "+2348000000000",
  "password": "SecurePass123",
  "send_invite_email": true
}
```

**Response**

```json
{
  "success": true,
  "message": "Admin account created successfully",
  "admin": {
    "id": "uuid",
    "email": "new@belpower.ng",
    "first_name": "Jane",
    "last_name": "Smith",
    "role": "support",
    "status": "active",
    "phone_number": "+2348000000000",
    "created_at": "...",
    "email_sent": true
  }
}
```

---

## 6. Sessions (protected)

| Endpoint | Purpose | Roles |
|----------|---------|--------|
| `GET /sessions/admins` | Staff panel sessions | `super_admin`, `admin` |
| `DELETE /sessions/admins/:sessionId` | Revoke staff session | `super_admin` |
| `GET /sessions/users` | Customer app sessions | `super_admin`, `admin`, `support` |

Legacy aliases:

- `GET /dashboard/admin-sessions`
- `DELETE /dashboard/admin-sessions/delete/:sessionId`
- `GET /dashboard/user-sessions` (use `GET /sessions/users` instead)

---

## 7. RBAC matrix (frontend gating)

| Action | super_admin | admin | support / content_manager | finance |
|--------|-------------|-------|---------------------------|---------|
| Login | ✅ | ✅ | ✅ | ✅ |
| `/profile/me` | ✅ | ✅ | ✅ | ✅ |
| `/profile/:id` | All | Not super/finance | ❌ | Own `/me` only |
| `/all` | All | No super/finance | ❌ | ❌ |
| `/register` | Any role | support, content_manager | ❌ | ❌ |
| `/setup-account` | ✅ | ❌ | ❌ | ❌ |
| `/password-reset-request` | Any | support, content_manager | ❌ | ❌ |
| Profile update/delete | ✅ | ❌ | ❌ | ❌ |

---

## 8. Suggested frontend flows

### Login

```
POST /login
  → requiresOTP? → OTP screen → POST /login/verify-otp
  → else save token + user/admin → dashboard
```

### Admin management page

```
super_admin:
  - List GET /all
  - Register modal → POST /register OR POST /setup-account
  - Reset password → POST /password-reset-request
  - Delete → DELETE /profile/delete/:id
  - View → GET /profile/:id

admin:
  - List GET /all (no super_admin/finance rows)
  - Register → role dropdown: support | content_manager only
  - Reset password → only for support/content_manager
  - View → GET /profile/:id (404 = hidden)
```

### Invite setup

```
Email link ?token=... → POST /complete-setup → login
```

### Forgot password (initiated by super_admin/admin)

```
POST /password-reset-request (with Bearer)
Target: email link → POST /reset-password (no Bearer) → login
```

---

## 9. Errors

Often:

```json
{
  "success": false,
  "error": "Human readable message",
  "code": "FORBIDDEN"
}
```

| Status | Meaning |
|--------|---------|
| 401 | Missing/invalid token or no `admin_sessions` row |
| 403 | Role not allowed |
| 404 | Not found or hidden admin (finance/super_admin for `admin`) |

---

## 10. Dev / ops

Verify database schema matches Sequelize models:

```bash
node scripts/check-admin-schema.js
```

Requires `DATABASE_URL` in `.env`.

---

## Quick reference — endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/login` | Public |
| POST | `/login/verify-otp` | Public |
| POST | `/complete-setup` | Public |
| POST | `/reset-password` | Public |
| GET | `/profile/me` | Bearer |
| GET | `/profile/:admin_id` | Bearer (`super_admin`, `admin`) |
| PUT | `/profile/update/:admin_id` | Bearer (`super_admin`) |
| DELETE | `/profile/delete` | Bearer (`super_admin`) |
| DELETE | `/profile/delete/:admin_id` | Bearer (`super_admin`) |
| GET | `/all` | Bearer (`super_admin`, `admin`) |
| POST | `/register` | Bearer (`super_admin`, `admin`) |
| POST | `/setup-account` | Bearer (`super_admin`) |
| POST | `/password-reset-request` | Bearer (`super_admin`, `admin`) |
| GET | `/sessions/admins` | Bearer (`super_admin`, `admin`) |
| DELETE | `/sessions/admins/:sessionId` | Bearer (`super_admin`) |
| GET | `/sessions/users` | Bearer (`super_admin`, `admin`, `support`) |

---

## 9. System — demo mode

Persisted flag for admin panel review sessions. Implemented in **belpower-back** (`routes/admin/systemRoutes.js`). Full spec: **`BACKEND_DEMO_MODE.md`**.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/system/demo-mode` | Bearer (any admin on `/system`) | Read `data.demoMode.{ enabled, updatedAt, updatedBy }` |
| PATCH | `/system/demo-mode` | Bearer (`super_admin`) | Set `{ enabled: boolean }` → `data.state` |

Stored in `system_maintenance_settings` under key `admin.demo_mode`. Frontend uses the backend first; local Next.js route is fallback only if the endpoint returns 404.

---

## Related code

| Path | Purpose |
|------|---------|
| `routes/admin/index.js` | Route definitions |
| `helpers/adminAccess.js` | Roles, visibility rules |
| `middleware/auth/adminAuth.js` | Auth + RBAC middleware |
| `helpers/adminAuditLog.js` | Password reset audit logging |
| `controllers/admin/adminProfileController.js` | Profile CRUD |
| `controllers/admin/adminController.js` | Login, list, register, setup |
| `controllers/admin/passwordResetController.js` | Password reset |
