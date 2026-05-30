# Yaatri — Nepal Travel Marketplace

> A three-tier MERN marketplace for booking Nepal trekking trips. Travelers book curated destinations, local guides earn per-engagement, and hotel-partners receive reservations — all settled through a transparent 15% platform commission / 20% cancellation policy.

![Tech](https://img.shields.io/badge/MERN-stack-A2D729) ![React](https://img.shields.io/badge/react-19-059D72) ![Mongoose](https://img.shields.io/badge/mongoose-9-1A434E) ![Express](https://img.shields.io/badge/express-5-1A434E)

---

## What's in this repo

```
fyp/
├── client/     React 19 + Vite 8 + Tailwind v4 frontend
├── server/    Express 5 + Mongoose 9 backend, MongoDB Atlas, Nodemailer, Gemini AI
└── PROJECT_TREE.txt — fully annotated file-by-file map of the project
```

Open **[PROJECT_TREE.txt](PROJECT_TREE.txt)** for a per-file description of every component.

---

## Key features

| Surface | What works |
|---|---|
| **Travelers** | Browse destinations on grid/map · interactive AI guide chat (Gemini) · book with calendar date-picker + guide picker · pay-then-approve lifecycle · favorites · dashboard with journey map |
| **Guides** | Role-aware dashboard with wallet (pending payout) · per-engagement attribution · upcoming trips · request-payout flow |
| **Hotel partners** | Live revenue card · 30-day occupancy chart · incoming reservations · payout requests |
| **Admin** | Live KPI overview with clickable revenue breakdown · destination CRUD with map coords + "Attractions Near You" + assigned guides/hotels · booking lifecycle management (mark paid → approve → auto-complete) · vendor ledger with one-click PAY · support ticket queue with escalation |
| **Support staff** | Limited admin access (only Messages · Bookings · Blogs) · "Forward to admin" escalation · payout-request segment |
| **Marketplace policy** | 15% platform commission on every booking · 20% structural forfeit on cancellation · 4% State Tax + 12% GST on every invoice · vendor share automatically credited/reversed |
| **Email** | Automatic booking invoice to traveler · engagement notice to assigned guide · reservation notice to linked hotel owner(s) · cancellation receipt · support inbox notification for new tickets |

---

## Tech stack

- **Frontend**: React 19, Vite 8, React Router 6, Tailwind v4 (with `@theme` tokens), Framer Motion, Leaflet 1.9 (OpenStreetMap tiles — no API key needed), Lucide React icons
- **Backend**: Express 5, Mongoose 9 (MongoDB Atlas), JWT auth, Helmet, Nodemailer 8, Zod validation
- **AI**: Google Gemini (`@google/generative-ai`) — multi-turn chat with Nepal-aware system prompt
- **Email**: SMTP via Nodemailer (Gmail App Password works out of the box)
- **Images**: Base64 inline storage on MongoDB documents (no Cloudinary / S3 dependency)
- **Dev**: Nodemon with a preflight script that auto-kills zombie port-5000 processes

---

## Local setup

### Prerequisites
- Node.js **18+** (tested on Node 24)
- A MongoDB Atlas cluster (or local `mongod` if you prefer)
- A Google Gemini API key — [aistudio.google.com](https://aistudio.google.com)
- (Optional) Gmail App Password if you want real email delivery — [App Passwords](https://myaccount.google.com/apppasswords)

### 1. Clone & install

```bash
git clone <repo>
cd fyp

# Backend deps
cd server && npm install && cd ..

# Frontend deps
cd client && npm install && cd ..
```

### 2. Backend `.env` ([server/.env](server/.env))

```env
# Required
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/yaatri
JWT_SECRET=<a-long-random-string>     # crashes startup if missing
GEMINI_API_KEY=<your-gemini-key>

# Optional — leave SMTP_HOST blank to skip real email delivery
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your.gmail@gmail.com
SMTP_PASS=<16-char-app-password>
SMTP_FROM_NAME=Yaatri Hub
SUPPORT_INBOX=your.gmail@gmail.com    # where support tickets land
```

### 3. Frontend `.env` ([client/.env](client/.env))

```env
VITE_API_URL=http://localhost:5000/api
```

That's it for the client. **Do NOT put `GEMINI_API_KEY` or `GOOGLE_MAPS_API_KEY` here** — the client never directly calls Gemini, and the map is Leaflet (no key needed).

### 4. Seed the database (first run)

```bash
cd server
node seed.js                   # creates admin user + sample destinations
node scripts/seedTestUsers.js  # creates 20 demo accounts: test1..test20 / password 1234567890
```

### 5. Run

Two terminals:

```bash
# Terminal 1 — backend (auto-restarts on file changes, kills zombies via preflight)
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open **http://localhost:5173**. Sign in as `test1` / `1234567890`, or as the admin (the seed script prints the generated admin password once).

---

## Demo accounts

| Username | Password | Role |
|---|---|---|
| `peyoosh_admin` (or similar) | _printed by `node seed.js`_ | admin |
| `test1` … `test20` | `1234567890` | traveler by default; promote any to guide/hotel via admin panel |

---

## Project structure

A high-level map. **[PROJECT_TREE.txt](PROJECT_TREE.txt)** has the full per-file breakdown.

```
server/
├── index.js              ← server entry (cors, helmet, mongo retry, route mounts)
├── models/               ← Mongoose schemas (User, Booking, Destination, Query, ...)
├── routes/               ← Express routers (auth, bookings, queries, admin, vendors, ai, ...)
├── middleware/           ← protect / validateAdmin / errorHandler / Zod validate
├── services/             ← business logic helpers
├── utils/                ← mailer · invoiceTemplate · weatherLogic
├── scripts/              ← seed, backfill, preflight, smoke tests
└── validations/          ← Zod schemas
```

```
client/src/
├── api/axios.js          ← axios with auto-URL + ERR_NETWORK retry
├── App.jsx + main.jsx    ← root + router
├── context/AuthContext   ← { user, setUser, login, logout }
├── components/           ← Common (AIChatbox, GoogleMapView, ProtectedRoute, ...), Layout
├── pages/                ← Auth, Blog, Contact, Destinations, Explore,
│                            Home, Policies, Profile, Support, UserDashboard, Admin
└── utils/                ← loadGoogleMaps (Leaflet!), Toast, image compression
```

---

## API surface (most useful endpoints)

### Public
- `GET  /api/health` — liveness + db status
- `GET  /api/destinations` — list all destinations
- `GET  /api/destinations/:id` — single destination with populated guides/hotels
- `GET  /api/blogs` — public blog feed
- `POST /api/queries` — file a support ticket
- `POST /api/ai/chat` — multi-turn Gemini chat
- `POST /api/login` · `POST /api/register` · `GET /api/me` — auth

### Bookings (auth required)
- `POST  /api/bookings` — place a booking (created with status `pending_payment`)
- `GET   /api/bookings/me` — my bookings
- `PATCH /api/bookings/:id/confirm-payment` — traveler marks paid → `escrow_held`
- `PATCH /api/bookings/:id/cancel` — cancel (20% forfeit applied + ledger reversed)
- `PATCH /api/bookings/:id/status` — admin transitions any status
- `GET   /api/bookings` — admin all-bookings

### Vendor (guide/hotel)
- `POST /api/vendors/payout-request` — auto-creates escalated `account_issue` ticket assigned to admin

### Admin
- `GET   /api/admin/stats` — KPI tiles (revenue, bookings, users, top destinations)
- `GET   /api/admin/financials/overview` — marketplace breakdown (commission, forfeit, owed-to-vendors)
- `POST  /api/admin/payouts/deduct` — atomic vendor payout
- `GET   /api/admin/providers?role=hotel|guide` — vendor list with ledger
- `PATCH /api/admin/users/:id/role` — assign role + per-role pricing
- `POST  /api/admin/destinations` · `DELETE /api/admin/destinations/:id`
- `GET   /api/queries` — support ticket queue
- `PATCH /api/queries/:id/escalate` — forward to admin (support OR admin role)
- `PATCH /api/queries/:id/status` — change ticket status

### User
- `GET /api/users/:id` — profile (owner+admin get the full doc including avatar)
- `PUT /api/users/profile` — update self (accepts `toggleFavoriteId` for atomic push/pull)
- `GET /api/users/:id/role-stats` — hotel/guide aggregates (revenue, upcoming, etc.)

---

## Booking lifecycle

```
                ┌────────────────────────────────────────────────────┐
                │              traveler places booking               │
                │                       ▼                            │
                │              ┌────────────────┐                    │
                │              │ pending_payment│  (default on POST) │
                │              └────────┬───────┘                    │
                │   traveler clicks     │                            │
                │   "I have paid"       ▼                            │
                │              ┌────────────────┐                    │
                │              │  escrow_held   │  payment received  │
                │              └────────┬───────┘  awaiting admin    │
                │     admin clicks      │                            │
                │     "APPROVE"         ▼                            │
                │              ┌────────────────┐                    │
                │              │    approved    │  vendor sees trip  │
                │              └────────┬───────┘                    │
                │     endDate passes    │  (sweep runs every 10 min) │
                │                       ▼                            │
                │              ┌────────────────┐                    │
                │              │   completed    │                    │
                │              └────────────────┘                    │
                │                                                    │
                │  At ANY non-terminal state, either party can       │
                │  cancel → 20% forfeit + 80% refund + ledger        │
                │  reversal (auto)                                   │
                └────────────────────────────────────────────────────┘
```

---

## Marketplace math

Every booking produces a snapshot:

```
subtotal       = baseRate × travelers × days
addOnsTotal    = sum(addOn rates × travelers × days)
                  (guide rate honors the picked guide's profileData.ratePerDay if set)
beforeTax      = subtotal + addOnsTotal
stateTax (4%)  = round(beforeTax × 0.04)
gst (12%)      = round(beforeTax × 0.12)
grossTotal     = beforeTax + stateTax + gst          [== totalCost legacy alias]

platformShare  = round(grossTotal × 0.15)
vendorShare    = grossTotal - platformShare
```

**On book**: vendor shares are credited to the assigned guide's + each linked hotel-owner's `vendorLedger.pendingPayout`.

**On cancel**: same credits reversed; `refund.eligibleAmount = grossTotal × 0.80`; `refund.forfeitedAmount = grossTotal × 0.20` stays with the platform.

See **[/policies](client/src/pages/Policies/Policies.jsx)** for the binding contract version.

---

## Deployment (Render.com)

Two services in one repo:

### Backend (`yaatri-backend`)
- **Type**: Web Service
- **Build**: `cd server && npm install`
- **Start**: `cd server && node index.js`
- **Env vars**: paste everything from your local [server/.env](server/.env) into Render → Environment

### Frontend (`yaatri-final`)
- **Type**: Static Site (NOT a Node web service!)
- **Build**: `cd client && npm install && npm run build`
- **Publish directory**: `client/dist`
- **Env vars**: `VITE_API_URL=https://yaatri-backend.onrender.com/api`

### ⚠️ CSS MIME-type issue on Render

If you ever see `Refused to apply style ... MIME type 'text/plain'` in production:
- The frontend is being served as a **Node web service** instead of a Static Site.
- Switch the service type to **Static Site** — Render then serves `dist/` with correct `text/css` headers.
- Add a `client/public/_redirects` file with `/*  /index.html  200` so React Router deep-links work.

### Render free tier cold-starts
Backend takes 30–60s to spin up after 15 min idle. The **AI chat already has a 45s axios timeout** to absorb this, but the first request after sleep may still appear slow. Upgrade to a paid plan to remove the spin-down.

---

## Useful npm scripts

```bash
# server/
npm run dev                                # nodemon with preflight (auto-kills zombies on port 5000)
npm start                                  # production: plain node index.js
node seed.js                               # seed admin + destinations
node scripts/seedTestUsers.js              # 20 demo accounts
node scripts/backfillDestinationCoords.js  # add lat/lng to existing destinations
node scripts/testInvoiceEmail.js           # generate invoice-preview.html from a real booking
```

```bash
# client/
npm run dev        # Vite dev server on 5173
npm run build      # production build into dist/
npm run preview    # serve the built dist/ locally
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ERR_CONNECTION_REFUSED` from browser to `:5000` | Backend not running (or zombie processes accumulated) | `cd server && npm run dev` — preflight kills zombies automatically. Check log for boot success |
| AI chat returns fallback "I'm having a moment…" | `GEMINI_API_KEY` missing on the running server | Add to .env, restart. Direct curl `POST /api/ai/chat -d '{"query":"hi"}'` should return `_fallback: null` |
| Booking invoice email never arrives | SMTP not configured | Set `SMTP_HOST=smtp.gmail.com`, `SMTP_USER`, `SMTP_PASS` (App Password) in [server/.env](server/.env) |
| Frontend production CSS broken | Render serving as Node service | See "CSS MIME-type issue" above |
| `Map is not a constructor` in dev console | Stale loader cached from when we used Google Maps | We're on Leaflet now — hard-refresh the browser |

---

## Acknowledgements

Built as a final-year project. Open-source pillars used:

- [React](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com)
- [Express](https://expressjs.com), [Mongoose](https://mongoosejs.com)
- [Leaflet](https://leafletjs.com) + [OpenStreetMap](https://www.openstreetmap.org)
- [Google Gemini](https://ai.google.dev)
- [Nodemailer](https://nodemailer.com)
- [Lucide icons](https://lucide.dev)

---

© 2026 Yaatri Hub · Lalitpur, Nepal
