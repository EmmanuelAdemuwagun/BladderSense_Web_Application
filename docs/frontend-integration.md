# Frontend Integration Brief — BladderSense Tracking Summary & Reminders

## 0. Background (why this work exists)

A clinical reviewer (Dr. Olagundoye) gave two pieces of feedback on the tracking flow:

1. **7 days is too short.** Tracking should run over a **30-day window** and produce a **monthly progress summary** so patients and clinicians can see trends, not just isolated days.
2. **Users forget to come back.** There should be a **reminder** nudging users to return and log their entry (she asked about a "push notification at the beginning of each week").

The **backend for both is now built and pushed** (branch `claude/success-confirmation-f529l5`). Your job is the UI. Nothing below requires backend changes — the contracts are final. This brief tells you exactly what endpoints exist, their shapes, and what screens to build.

> **Important expectation-setting:** reminders are currently delivered by **email**, not native mobile push. The reminder *logic and preferences* are complete; delivery just goes through the existing email system. Do **not** build a "push notifications" toggle implying lock-screen alerts. UI copy should say "we'll **email** you a reminder." (Native push is a possible later phase.)

---

## 1. Auth — applies to every endpoint below

- All endpoints require the user to be logged in.
- Auth is a **session cookie** (`bladdersense_session`) — there is no bearer token.
- **Every request must send credentials.** With `fetch`: `credentials: "include"`. With axios: `withCredentials: true`. If you forget this, you'll get `401`.
- Unauthenticated / expired session → `401 { "error": "Authentication required" }` (or `"Invalid session"` / `"Session expired"`). Treat any 401 as "bounce to login."
- Base path for everything is `/api`.

---

## 2. Tracking entries (existing — included so your forms match validation exactly)

These already existed; listed so your form inputs use the **exact** allowed values (the backend rejects anything else with a 400).

**Field value enums (must match exactly, case-sensitive, all strings):**

| Field | Allowed values |
|---|---|
| `nightTimeUrination` | `"0"`, `"1"`, `"2"`, `"3+"` |
| `eveningFluids` | `"None"`, `"Small"`, `"Moderate"`, `"Large"` |
| `activityLevel` | `"None"`, `"Light"`, `"Moderate"`, `"High"` |
| `stressLevel` | `"1"`, `"2"`, `"3"`, `"4"`, `"5"` |
| `sleepQuality` | `"Poor"`, `"Fair"`, `"Good"` |
| `notes` | optional free text (string or omit) |
| `entryDate` | `"YYYY-MM-DD"` |

**`POST /api/tracking`** — create one entry.

Body: `{ entryDate, nightTimeUrination, eveningFluids, activityLevel, stressLevel, sleepQuality, notes? }`

- `201` → `{ message, entry: { id, entryDate, nightTimeUrination, eveningFluids, activityLevel, stressLevel, sleepQuality, notes, updatedAt } }`
- `400` → `{ error: "Validation failed", fields: { <fieldName>: "<message>", ... } }` — render these under each input.
- `409` → `{ error: "A tracking entry already exists for this date" }` — **one entry per day.** If you get this, the user already logged today; route them to *edit* instead of *create*.

**`GET /api/tracking`** → `{ entries: [ ...same shape as entry... ] }`, newest date first.

**`PUT /api/tracking/:id`** — edit an existing entry. Same body **minus `entryDate`** (date is fixed once created).

- `200` → `{ message, entry }`, `400` validation, `404` if not theirs/not found.

---

## 3. NEW — Monthly progress summary

**`GET /api/tracking/summary?days=30`**

- `days` is optional. **Default 30.** Clamped to `1..90` server-side (anything out of range is coerced, not rejected). For the doctor's requirement, just call it with no param (or `?days=30`).
- The window is the last `days` calendar days **ending today**, inclusive.
- Requires auth.

**Response `200`:**

```json
{
  "summary": {
    "period": {
      "days": 30,
      "startDate": "2026-08-10",
      "endDate": "2026-09-08"
    },
    "adherence": {
      "daysTracked": 24,
      "expectedDays": 30,
      "percent": 80
    },
    "nightTimeUrination": {
      "averagePerNight": 1.71,
      "distribution": { "0": 3, "1": 8, "2": 9, "3+": 4 },
      "trend": {
        "firstHalfAverage": 2.67,
        "secondHalfAverage": 1.0,
        "direction": "improving"
      }
    },
    "eveningFluids": {
      "distribution": { "None": 5, "Small": 6, "Moderate": 8, "Large": 5 }
    },
    "activityLevel": {
      "distribution": { "None": 4, "Light": 7, "Moderate": 9, "High": 4 }
    },
    "stressLevel": { "average": 3.14 },
    "sleepQuality": {
      "average": 2.14,
      "distribution": { "Poor": 6, "Fair": 9, "Good": 9 },
      "trend": {
        "firstHalfAverage": 1.33,
        "secondHalfAverage": 2.75,
        "direction": "improving"
      }
    }
  }
}
```

**Field-by-field meaning (build your UI from this):**

- `period` — the date range covered. Show as a header: *"Your last 30 days (Aug 10 – Sep 8)."*
- `adherence` — `daysTracked` out of `expectedDays`, plus `percent`. Render as a **ring/progress bar**: "24 of 30 days tracked (80%)." This is the "are they keeping up" number.
- `nightTimeUrination`:
  - `averagePerNight` — average episodes/night (number, rounded to 2 dp). This is the **headline nocturia metric.** `"3+"` is counted as `3`.
  - `distribution` — counts per bucket → **bar chart** (x = 0/1/2/3+, y = number of nights).
  - `trend` — compares the **first half** of the window vs the **second half**. Use `direction` to show an arrow/badge.
- `eveningFluids`, `activityLevel` — categorical `distribution` only → bar charts.
- `stressLevel.average` — 1–5 average → a single stat/gauge.
- `sleepQuality`:
  - `average` — on a **1–3 scale** (Poor=1, Fair=2, Good=3). If you show a label, map back: `<1.67 → "Poor-ish"`, `1.67–2.33 → "Fair"`, `>2.33 → "Good"` (your call on thresholds).
  - `distribution` → bar chart.
  - `trend` — same first-half/second-half comparison.

**`trend.direction` possible values — handle all four:**

| Value | Meaning | Suggested UI |
|---|---|---|
| `"improving"` | getting better over the window | green ▲ "Improving" |
| `"worsening"` | getting worse | red ▼ "Worsening" |
| `"stable"` | roughly flat | grey ▬ "Stable" |
| `"insufficient-data"` | not enough entries to compare halves | muted "Not enough data yet" |

> Note: `direction` is already **semantically correct** — for nocturia, *fewer* episodes reports as `"improving"`; for sleep, *higher* quality reports as `"improving"`. You do **not** need to invert anything. Just render the word/arrow.

**Empty / sparse data:** if the user has logged nothing, `averagePerNight` and `average` come back `null` and distributions are all zeros. **Guard for `null`** and show an empty state ("Track a few days to unlock your summary") rather than rendering `null`.

**Screen to build:** a **"Progress" / "My Report"** screen. Suggested layout, top to bottom: period header → adherence ring → nocturia card (big average + trend badge + bar chart) → sleep card (average + trend + bars) → fluids/activity/stress cards. This screen is the concrete answer to the doctor's "monthly progress summary."

---

## 4. NEW — Reminder preferences

Two endpoints. Both require auth.

**`GET /api/reminders`** → returns the user's settings (auto-creates defaults on first read, so it never 404s):

```json
{
  "preferences": {
    "remindersEnabled": true,
    "frequency": "daily",
    "lastRemindedAt": "2026-09-07T08:00:00.000Z",
    "updatedAt": "2026-09-07T08:00:00.000Z"
  }
}
```

- `remindersEnabled` — boolean master switch.
- `frequency` — `"daily"` or `"weekly"` only.
  - `"daily"` = nudged on any day they haven't logged.
  - `"weekly"` = nudged only at the **start of the week (Monday)** if they haven't logged that week. (This maps to the doctor's "beginning of each week.")
- `lastRemindedAt` — when we last emailed them; **can be `null`** (never reminded yet). Read-only — display only if useful ("Last reminder: …").
- `updatedAt` — read-only.

**`PUT /api/reminders`** — update settings. Send **only the fields you're changing**; at least one is required.

Body (both optional, but ≥1 required):

```json
{ "remindersEnabled": false, "frequency": "weekly" }
```

- `200` → `{ message, preferences: { ...same shape as GET... } }`
- `400` `{ error: "No reminder changes were provided" }` — you sent neither field.
- `400` `{ error: "Validation failed", fields: { remindersEnabled?, frequency? } }` — wrong types/values. `remindersEnabled` must be a real boolean; `frequency` must be exactly `"daily"` or `"weekly"`.

**Screen to build:** a **"Reminders" settings section** with:

- a master **toggle** (`remindersEnabled`),
- a **daily / weekly** choice (radio or segmented control) — disable/grey it when the master toggle is off,
- helper copy: *"We'll **email** you a reminder to log your entry."* (weekly variant: *"…every Monday."*).
- On change, `PUT` only the changed field(s) and reflect the returned `preferences`.

Do **not** build any "push notification permission" prompt — delivery is email for now.

---

## 5. Summary of what to build

1. **Progress/Report screen** → `GET /api/tracking/summary` (default 30 days). Adherence ring, nocturia & sleep trend cards, distribution bar charts, stress gauge. Handle `null`/empty and all four `trend.direction` values.
2. **Reminders settings** → `GET`/`PUT /api/reminders`. Master toggle + daily/weekly. Email-based copy.
3. **Reframe tracking as a 30-day journey** in existing copy where it currently implies 7 days (progress like "Day 12 of 30", encouragement to keep going).
4. Make sure **every** request sends credentials (cookie auth), and keep tracking-entry form values matching the enums in §2 exactly.

## 6. Things NOT to do

- Don't add UI implying native/lock-screen push.
- Don't let the tracking form submit values outside the enums (backend 400s).
- Don't assume more than one entry per day is allowed (409 on duplicate date).
- Don't render `null` averages — guard with empty states.

## 7. Open questions to raise with the product owner if they block you

- Exact label thresholds for the 1–3 sleep average.
- Whether the Progress screen should also offer a 7-day view toggle (backend already supports `?days=` 1–90, so this is free if wanted).
