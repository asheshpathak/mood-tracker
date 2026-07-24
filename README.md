# Mood

A calm place to record how you feel, keep the observations you work out along
the way, and see the patterns underneath both.

Two independent apps in one repository:

```
mood-tracker/
├── backend/     Node · TypeScript · Express 5 · MongoDB   → deploys to Railway
└── frontend/    React 19 · TypeScript · Vite · Redux      → deploys to Vercel
```

They share no packages on purpose — each folder installs, builds and deploys on
its own, which is what makes the split hosting straightforward.

---

## Quick start

**Prerequisites:** Node 20.19+ and a MongoDB you can reach (local or Atlas).

```bash
# 1. install both apps
npm run install:all

# 2. backend config — a .env is created for you on first run, or:
cp backend/.env.example backend/.env
#    then set MONGODB_URI and replace both JWT secrets with long random strings:
#    node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3. frontend config
cp frontend/.env.example frontend/.env.local

# 4. optional — 8 weeks of realistic demo data
npm run seed        # demo@moodtracker.app / demo12345

# 5. run both
npm run dev         # API on :4000, web on :5173
```

`npm run dev:api` and `npm run dev:web` run them separately.

If you have MongoDB via Homebrew: `brew services start mongodb-community`.

---

## What the app does

**Check in.** One pad captures both dimensions of a feeling at once —
pleasantness left to right, energy bottom to top. That's the circumplex model of
affect, and it's the reason a check-in takes seconds instead of a form. Then,
optionally: emotion words (ordered by the quadrant you landed in, so the
relevant ones are always on top), what was shaping it, a note, and a time if you
are logging something from earlier.

**Insights.** Trend over time, distribution across the five steps, the shape of
your day by three-hour block, how the week goes, which influences move you
furthest from your own average, and the words you reach for most. Plus a few
plain-language observations generated from those aggregates — deliberately
conservative, and silent until there is enough data to mean anything.

**Observations.** A separate feed for the epiphanies — the things you work out
about yourself. Title optional, tags, pin the ones that keep proving true,
full-text search, infinite scroll.

**Also:** streaks, timeline with filters and search, JSON export of everything
you have written, JWT auth with refresh-token rotation, and installable as a PWA
from the browser's share sheet.

---

## Architecture notes

**Denormalised local time.** Every entry stores `localDate`, `localHour` and
`localWeekday` alongside the UTC timestamp. Analytics then group on plain
strings and integers instead of doing timezone arithmetic inside MongoDB — which
is both much faster and much harder to get subtly wrong.

**Diverging mood scale.** Mood is a polarity, so the colour scale is diverging:
cool violet for unpleasant, warm amber for pleasant, neutral grey between. Each
arm is a single hue with monotone lightness and the poles separate under
protanopia and deuteranopia. Fill colours and text colours are deliberately
different values — see `frontend/src/lib/mood.ts`.

**Refresh-token rotation.** Access tokens last 30 minutes; refresh tokens are
stored hashed on the user document and retired the moment they are used. If a
retired token is ever presented, every session for that account is dropped.
Tokens go in the JSON body rather than cookies, because third-party cookie
blocking makes a cross-site cookie between `vercel.app` and `railway.app`
unreliable on mobile Safari.

**Cursor pagination** on both feeds, keyed on the timestamp — stable while you
are adding entries, unlike offset paging.

---

## Deploying

### Backend → Railway

1. New project → **Deploy from GitHub repo** → set **Root Directory** to `backend`.
2. Add a **MongoDB** service to the project (or use Atlas).
3. Set the service variables:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `${{MongoDB.MONGO_URL}}` (or your Atlas string) |
   | `MONGODB_DB_NAME` | `mood-tracker` |
   | `JWT_ACCESS_SECRET` | long random string |
   | `JWT_REFRESH_SECRET` | a *different* long random string |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |
   | `ALLOW_REGISTRATION` | `false` once your own account exists |

   `PORT` is injected by Railway — don't set it.

4. Railway reads `backend/railway.json` for the build and start commands, and
   health-checks `/api/health`.

### Frontend → Vercel

1. New project → import the repo → set **Root Directory** to `frontend`.
2. Framework preset: **Vite** (or leave it — `frontend/vercel.json` covers it).
3. Environment variable:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-railway-service>.up.railway.app/api` |

   The `/api` suffix matters. `VITE_*` values are baked in at build time, so
   changing it requires a redeploy.

4. Deploy, then add the resulting domain to `CORS_ORIGINS` on Railway.

**Order of operations:** deploy the backend first so you have its URL, deploy the
frontend with that URL, then set `CORS_ORIGINS` to the Vercel domain and let the
backend redeploy.

---

## API

All routes are under `/api`. Everything except `/health`, `/auth/*` and
`/moods/vocabulary` needs `Authorization: Bearer <accessToken>`.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Liveness + database state |
| `POST` | `/auth/register` · `/auth/login` · `/auth/refresh` | Session |
| `POST` | `/auth/logout` · `/auth/change-password` | Session |
| `GET` `PATCH` | `/auth/me` | Profile |
| `GET` | `/moods/vocabulary` | Emotion and influence vocabulary |
| `GET` | `/moods/today` | Everything the home screen needs |
| `GET` | `/moods/analytics?range=7d\|30d\|90d\|365d\|all` | Aggregates + insights |
| `GET` `POST` | `/moods` | List (cursor-paged, filterable) · create |
| `GET` `PATCH` `DELETE` | `/moods/:id` | Single entry |
| `GET` | `/observations/tags` · `/observations/stats` | Facets |
| `GET` `POST` | `/observations` | List (cursor-paged, searchable) · create |
| `GET` `PATCH` `DELETE` | `/observations/:id` | Single observation |
| `POST` | `/observations/:id/pin` | Toggle pin |

Errors are always `{ "error": { "code", "message", "details?" } }`, where
`details` maps field names to messages so forms can render them inline.

---

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Both apps, together |
| `npm run build` | Type-check and build both |
| `npm run typecheck` | Type-check both, no output |
| `npm run seed` | Reset and reseed the demo account |
# mood-tracker
# mood-tracker
