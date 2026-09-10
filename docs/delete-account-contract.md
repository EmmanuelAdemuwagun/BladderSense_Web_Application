# Backend Contract — Delete Account

This is what the frontend now calls. The **Sign Out** endpoint already exists;
the **Delete Account** endpoint is new and needs to be implemented on the
backend (Heroku API behind `/api`).

## 1. Auth (same as every other endpoint)

- Auth is the **session cookie** `bladdersense_session` — no bearer token.
- The frontend sends `credentials: "include"` on every request.
- The backend identifies the user **from the session cookie**, not from the
  request body. Never trust an id/email in the body to decide whose account to
  delete.
- No valid session → `401 { "error": "Authentication required" }`.
- Base path for everything is `/api`.

## 2. Sign Out (already implemented — listed for completeness)

**`POST /api/auth/logout`**

- Clears/expires the `bladdersense_session` cookie.
- Response: `200 { "message": "Signed out." }` (body is not read by the frontend).
- The frontend also clears its local copy of the user and returns to `/`.

## 3. Delete Account (NEW — please implement)

**`DELETE /api/profile`**

- **Request body:** none required. The user is taken entirely from the session
  cookie. (If a body is sent, ignore it.)
- **What the server must do:**
  1. Resolve the current user from the session cookie.
  2. Permanently delete that user **and all data belonging to them**:
     - the user record,
     - all their tracking entries,
     - their reminder preferences,
     - any outstanding tokens / OTP codes / sessions for that user.
  3. Expire the `bladdersense_session` cookie (send a clearing `Set-Cookie`),
     so the deleted user is not left with a live session.
- **Success:** `200 { "message": "Your account has been deleted." }`
  (the frontend only checks for a 2xx; the message is optional).
- **Errors:**
  - `401 { "error": "Authentication required" }` — no/invalid session.
  - `500 { "error": "<message>" }` — the frontend shows this text to the user.

### Frontend behaviour after a successful delete

On `2xx` the frontend clears its local session and redirects to the home page
(`/`). No confirmation code is sent from the client — the user confirms with a
two-step "Are you sure?" prompt in the UI before the request is made.

### If you prefer a different route or method

The frontend calls `DELETE /api/profile` (see `src/utils/api.js` →
`api.deleteAccount`). If the backend needs a different shape (e.g.
`POST /api/auth/delete-account`, or a required `{ "confirm": true }` body),
tell us the exact route/method/body and we'll match it in one line.
