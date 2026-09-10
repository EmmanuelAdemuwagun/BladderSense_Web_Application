# BladderSense — Backend Requirements & API Contract

This is the complete list of what the **frontend** (this repo) expects from the
**backend API**. It is written from the actual frontend code
(`src/utils/api.js` and the pages that call it), so it is the source of truth
for the request/response shapes the app relies on.

- ✅ **Already working** — the app uses this today; listed so you don't break it.
- 🆕 **Needs implementing** — new endpoint the frontend now calls.
- ⚠️ **Please verify** — likely already works, but a known integration pitfall.

---

## 1. Architecture & where the backend lives

- The web app is a static React SPA hosted on **Netlify** (`bladdersense.com`).
- All API calls go to a **same-origin path `/api/*`**, which `netlify.toml`
  reverse-proxies to the backend on Heroku:
  `https://bladdersense-582048c5cf7e.herokuapp.com/api/:splat`.
- The frontend never calls Heroku directly. Every path below is relative to
  **`/api`** (e.g. "`POST /auth/register`" means
  `POST https://<site>/api/auth/register`).
- The proxy is what keeps the session cookie **first-party** (see §2).

---

## 2. Authentication model ⚠️

- Auth is a **session cookie** named **`bladdersense_session`**. There is **no
  bearer token** — the frontend stores no secret and sends no `Authorization`
  header.
- The frontend sends **`credentials: "include"`** on every request. The backend
  must accept and set the cookie.
- **Cookie attributes matter (this is the #1 thing that breaks on iOS):**
  - `HttpOnly` — yes.
  - `Secure` — yes (HTTPS).
  - `SameSite=Lax` (or `None` if ever cross-site) — but because we proxy
    through the same origin, `Lax` works.
  - **Must NOT set `Domain=...herokuapp.com`.** It must be a **host-only
    cookie** (no `Domain` attribute) so the Netlify proxy can re-attribute it to
    `bladdersense.com` as first-party. If you pin the domain to Heroku, iOS
    Safari/Chrome silently drop it and users get bounced back to sign-in.
- Any request without a valid session returns **`401`**:
  `{ "error": "Authentication required" }` (the frontend treats any 401 as
  "sign the user out / bounce to login").

---

## 3. Error format (all endpoints)

- Errors return a non-2xx status with a JSON body: `{ "error": "<message>" }`.
- The frontend shows `error` text **directly to the user**, so make messages
  human-readable (e.g. "An account with this email already exists.").
- Validation errors may additionally return
  `{ "error": "Validation failed", "fields": { "<name>": "<message>" } }`.

---

## 4. Verification / sign-in code format ⚠️

- Registration verification and sign-in both use a **6-character one-time code**
  emailed to the user (the current production email sends a **6-digit** code,
  e.g. `420075`).
- The frontend **uppercases** the code and accepts the pattern **`[A-Z0-9]{6}`**
  before sending it. So the backend may issue **digits, uppercase letters, or a
  mix** — all fine. Just keep it to **exactly 6 characters** from that set.
- The frontend sends the code in the JSON body as `token` (see §5).
- Codes should expire (production email says a few minutes; the app copy says up
  to 15 minutes — align these).

---

## 5. Auth endpoints

### 5.1 ✅ Register
**`POST /auth/register`**
Body:
```json
{ "firstName": "Jane", "lastName": "Doe", "preferredName": "Janey", "email": "jane@example.com" }
```
- `preferredName` is optional (may be `""`).
- On success emails a 6-character verification code and returns `200`
  (e.g. `{ "message": "Registration successful. Check your email." }`).
- Errors the frontend already handles: `409` (email exists), `429` (too many
  attempts), `400` (invalid input).

### 5.2 ✅ Verify email (registration)
**`POST /auth/verify-email`**
Body:
```json
{ "email": "jane@example.com", "token": "420075" }
```
- Marks the account verified.
- `200` on success; `400` if the code is wrong/expired.

### 5.3 ✅ Resend verification code
**`POST /auth/resend-verification`**
Body: `{ "email": "jane@example.com" }`
- Sends a fresh verification code. `200` on success.

### 5.4 ✅ Request sign-in code
**`POST /auth/request-login`**
Body: `{ "email": "jane@example.com" }`
- Emails a 6-character sign-in code. `200` on success.
- If the account is not verified, return an error whose message contains the
  phrase **"not been verified"** — the frontend keys off that to show the
  "verify your email" helper. (e.g. `{ "error": "This email has not been verified yet." }`)
- ⚠️ **Unknown / deleted email:** decide and implement one of these — the
  current behaviour is confusing (a deleted account gets no email and no
  message):
  - **Recommended for this app (clear UX):** return
    `404 { "error": "No account found for this email. Please register." }`.
    The frontend now displays this, and if the message contains the phrase
    **"no account"** it also shows an inline **Register here** button.
  - **If you prefer to prevent account enumeration:** return `200` with **no
    email sent** for unknown addresses (identical response to the known case).
    If you choose this, tell the frontend team — the sign-in screen should then
    show a neutral "If an account exists, we've sent a code" note instead of
    advancing straight to the code-entry step, so the user isn't left waiting
    for an email that will never arrive.
  - Pick one and keep it consistent. For a small clinical app, the first option
    is friendlier; the enumeration risk is low.

### 5.5 ✅ Verify sign-in code (log in)
**`POST /auth/verify-login`**
Body:
```json
{ "email": "jane@example.com", "token": "420075" }
```
- On success: **set the `bladdersense_session` cookie** and return the user:
```json
{ "user": { "id": "…", "firstName": "Jane", "lastName": "Doe", "preferredName": "Janey", "email": "jane@example.com" } }
```
- The frontend **requires `user` in the response** (it saves it locally to show
  the user's details). Missing `user` is treated as an error.
- `400`/`401` if the code is wrong/expired.

### 5.6 ✅ Sign out
**`POST /auth/logout`**
- Expire/clear the `bladdersense_session` cookie.
- `200` (body not read). The frontend also clears its local copy and returns
  the user to `/`.

### 5.7 🆕 Delete account
**`DELETE /profile`**
- **Request body: none.** Identify the user **from the session cookie** — never
  from an id/email in the body (that would let one user delete another).
- The server must permanently delete, for the current user:
  1. the user record,
  2. all their tracking entries,
  3. their reminder preferences,
  4. any outstanding tokens / OTP codes / sessions.
- Then **expire the `bladdersense_session` cookie** (clearing `Set-Cookie`).
- Success: `200 { "message": "Your account has been deleted." }` (frontend only
  checks for 2xx).
- Errors: `401 { "error": "Authentication required" }`, or
  `500 { "error": "<message>" }` (shown to the user).
- After a 2xx the frontend clears its local session and redirects to `/`.
- **Alternative shapes:** the frontend calls `DELETE /api/profile`
  (`src/utils/api.js` → `api.deleteAccount`). If you'd rather expose
  `POST /auth/delete-account` and/or require a `{ "confirm": true }` body, tell
  us the exact route/method/body and we'll match it in one line. (The user
  already confirms with a two-step "Are you sure?" prompt in the UI.)

---

## 6. Profile endpoints

### 6.1 ✅ Get profile
**`GET /profile`** (auth required)
- Returns the signed-in user, either as `{ "user": { … } }` or the user object
  directly (the frontend accepts both).
- User shape: `{ id, firstName, lastName, preferredName, email, emailVerified, createdAt, lastLoginAt }`.

### 6.2 ✅ Update profile
**`PUT /profile`** (auth required)
Body: `{ "preferredName": "Janey" }`
- Currently only `preferredName` is edited. Return the updated user as
  `{ "user": { … } }` (or the app falls back to merging locally).

### 6.3 🆕 Delete account — see §5.7.

---

## 7. Tracking endpoints ✅

Field value enums (case-sensitive strings — reject anything else with `400`):

| Field | Allowed values |
|---|---|
| `nightTimeUrination` | `"0"`, `"1"`, `"2"`, `"3+"` |
| `eveningFluids` | `"None"`, `"Small"`, `"Moderate"`, `"Large"` |
| `activityLevel` | `"None"`, `"Light"`, `"Moderate"`, `"High"` |
| `stressLevel` | `"1"`, `"2"`, `"3"`, `"4"`, `"5"` |
| `sleepQuality` | `"Poor"`, `"Fair"`, `"Good"` |
| `notes` | optional free text |
| `entryDate` | `"YYYY-MM-DD"` |

- **`POST /tracking`** — body:
  `{ entryDate, nightTimeUrination, eveningFluids, activityLevel, stressLevel, sleepQuality, notes }`.
  `201 { message, entry: { id, … } }`. `409` if an entry already exists for that
  date (one entry per day → the app switches to editing).
- **`GET /tracking`** → `{ entries: [ … ] }`, newest date first.
- **`PUT /tracking/:id`** — same body **minus `entryDate`**. `200 { message, entry }`.

See `docs/frontend-integration.md` for the monthly summary
(`GET /tracking/summary`) and reminder preferences (`GET`/`PUT /reminders`)
contracts, which are also part of the backend surface.

---

## 8. Quick checklist for the backend developer

- [ ] 🆕 Implement **`DELETE /api/profile`** (delete user + all their data, clear cookie) — §5.7.
- [ ] ⚠️ Confirm the session cookie is **host-only** (no `Domain=…herokuapp.com`), `HttpOnly`, `Secure`, `SameSite=Lax` — §2.
- [ ] ⚠️ Confirm `POST /auth/verify-login` returns `{ "user": … }` and sets the cookie — §5.5.
- [ ] ⚠️ Confirm the "not verified" error message on `POST /auth/request-login` contains the phrase **"not been verified"** — §5.4.
- [ ] ⚠️ Confirm verification/sign-in codes are exactly 6 chars from `[A-Z0-9]` and expire — §4.
- [ ] Keep all existing register / verify / login / profile / tracking shapes as above.
