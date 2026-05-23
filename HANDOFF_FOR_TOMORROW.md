# Yaatri — Handoff prompt for next session

> Paste the section below to Claude Code tomorrow. Everything above the `---` is just context for me to remember.

## Snapshot of where we left off (2026-05-22)

**Backend running on `0.0.0.0:5000`** with hardened Mongo connection (retry + reconnect listeners + graceful shutdown). `.env` has `PORT=0.0.0.0:5000` which is parsed tolerantly. All endpoints respond 200.

**Routes already built and verified end-to-end:**
- `POST /api/bookings`, `GET /api/bookings/me`, `GET /api/bookings`, `PATCH /api/bookings/:id/status`
- `POST /api/queries`, `GET /api/queries`, `PATCH /api/queries/:id/status`
- `POST /api/users/profile` (avatar + bio), `GET /api/users/:id`
- `POST /api/ai/chat` (returns `{reply, redirectTo, suggestedDestinations}`)
- `GET /api/health`, `GET /api/stats/metrics`

**Pages already built:**
- `/destinations/book/:id` — full calculator (travelers × days × add-ons + VAT 13%, server re-validates)
- `/explore` — full-page AI chat (accepts handoff state from floating widget)
- `/support` — query form with type selector
- `/dashboard` — 3-tab sidebar layout (Trips / Favorites / Settings) with hamburger toggle
- `/profile/:id` — role-adaptive profile with Base64 avatar upload

**Models in place:** `User` (with `profileData.favoriteDestinations`, `profileData.languages`, etc.), `Destination`, `Hotel`, `Blog`, `Booking`, `Query`, `Setting`, `Guide`, `HotelProfile`.

---

## PROMPT TO PASTE INTO CLAUDE CODE TOMORROW

I'm continuing work on Yaatri, my MERN travel platform. Yesterday's session built the booking page (`/destinations/book/:id`), the full-page Explore AI chat (`/explore`), a Support form (`/support`), and refactored the User Dashboard into a 3-tab layout (`/dashboard`). The Mongo models `Booking` and `Query` were added with full REST endpoints. Now I need to close five gaps that prevent these features from being reachable and useful in the live UI. Please implement all five in one pass:

### 1. Wire the booking flow into the destination detail page

On `client/src/pages/Destinations/DestinationDetail.jsx`, add a prominent **"Book this trip"** button in the right-hand main panel (near the destination name/region header). On click, it should `navigate(\`/destinations/book/\${nodeToRender._id}\`)`. The button should match the existing design (hill-green accent border, sci-fi typography), and only show when the user is logged in — if not, redirect them to `/login` with a return-after-login flag (or just bounce to login and let them re-navigate). Also add a smaller secondary "Save to favorites" heart-button next to it that:

- Reads `user.profileData.favoriteDestinations` from `AuthContext` to determine current state
- Toggles by calling `PUT /api/users/profile` with the updated array (the route already accepts `favoriteDestinations`)
- Updates `AuthContext.setUser` on success so the dashboard's Favorites tab reflects the change instantly

### 2. Build an admin queries panel

In `client/src/pages/Admin/`, create `QueryManager.jsx` modeled after `BlogManager.jsx`. It should:

- Fetch all tickets via `GET /api/queries` on mount (admin-only)
- Render a table with columns: timestamp, type (color-coded badge: red for Report Issue, lime for Suggestion, green for General Feedback), email, subject, status
- Each row expands inline to show the full message and the server-rendered `mailRendered` template
- Each row has buttons to PATCH status to `in_progress`, `resolved`, or `dismissed` via `PATCH /api/queries/:id/status`
- Add a route entry to `Dashboard.jsx` (admin) at `/admin/queries` and a sidebar nav link in `AdminLayout.jsx`

Show the unread/new ticket count as a small lime badge on the sidebar item ("Queries · 3").

### 3. Add navigation entries for the new pages

In `client/src/components/Layout/Navbar.jsx` (desktop + mobile menu):

- Add an "Explore" link → `/explore` between "Destinations" and "Blog"

In `client/src/components/Layout/Footer.jsx`:

- In Column A or B, link "Support" → `/support` (replacing one of the placeholder links like "FAQ" or "Insurance")

### 4. Move the floating AI widget to bottom-left (as originally intended)

`client/src/components/Common/AIChatbox.jsx` currently uses `fixed bottom-6 right-6` for both the floating button and `fixed bottom-24 right-6` for the open widget. Change both to the **left** side: `bottom-6 left-6` and `bottom-24 left-6`. Make sure the open widget doesn't run off-screen on narrow viewports — keep its `w-96 max-h-[600px]` cap.

### 5. Wire actual email sending for `/api/queries`

Currently `server/routes/queryRoutes.js` only saves to MongoDB and emits a `console.warn` log. Add real email delivery using `nodemailer`:

- Add `nodemailer` to `server/package.json` dependencies and run `npm install`
- In `.env`, expect these new optional vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SUPPORT_INBOX` (defaults to `peyoosh@yaatri.np`)
- If `SMTP_HOST` is unset, **gracefully skip** email and only log (preserve current behavior). Never crash the route.
- If SMTP is configured: send the rendered template from `Query.mailRendered` to `SUPPORT_INBOX` after saving the ticket. Use a try/catch — failed send must NOT roll back the saved ticket.
- The route's HTTP response is unchanged — frontend still receives `{ticketId, message}` on 201.

### Non-negotiable constraints (apply to every change above)

- **No new top-level dependencies** other than `nodemailer` (and only if you reach step 5).
- **No Cloudinary or third-party media storage.** Avatars and any image-style payloads stay as compressed Base64 strings in MongoDB documents (`express.json` is already at 50mb).
- **Every empty-state must render a fallback** (e.g. "No queries yet — your support inbox is clean") — never let `.map` run on `undefined`.
- **Every new POST/PATCH must return 400 with `{message}` on validation failure**, never 500.
- **Reuse the existing theme tokens**: `bg-obsidian`, `bg-teal-steel`, `bg-toxic-lime`, `bg-hill-green`, `text-terai-harvest`, `text-himalayan-mist` (defined in `client/src/index.css` `@theme` block). Don't introduce new `bg-[#xxxxxx]` arbitrary literals — use the named tokens.
- **Restart the backend after server-side changes** (the Mongo connect is at the top of `server/index.js`; nodemon should pick up file changes automatically when run via `npm run dev`).
- **Smoke-test before declaring done**: hit each new endpoint with a real fetch call against the live `localhost:5000` and confirm 200/201/400 as appropriate.

### Files you'll touch (predicted)

```
client/src/pages/Destinations/DestinationDetail.jsx     (item 1)
client/src/pages/Admin/QueryManager.jsx                  (item 2 — NEW file)
client/src/pages/Admin/Dashboard.jsx                     (item 2 — add admin route)
client/src/pages/Admin/AdminLayout.jsx                   (item 2 — sidebar link)
client/src/components/Layout/Navbar.jsx                  (item 3)
client/src/components/Layout/Footer.jsx                  (item 3)
client/src/components/Common/AIChatbox.jsx               (item 4 — position swap)
server/routes/queryRoutes.js                             (item 5 — add nodemailer step)
server/package.json                                      (item 5 — add nodemailer)
.env                                                     (item 5 — document new vars)
```

### Quick-check facts about the codebase

- `AuthContext` exposes `{ user, setUser, login, logout, loading }`
- Auth-protected routes use `<ProtectedRoute user={loggedInUser}>` wrapper from `client/src/components/Common/ProtectedRoute.jsx`
- Admin routes use `<ProtectedRoute user={loggedInUser} isAdminRoute={true}>`
- Backend `protect` middleware sets `req.user` (full Mongoose doc minus password). Use `req.user._id`, not `req.user.id`.
- Backend `validateAdmin` middleware enforces `req.user.isAdmin === true`.
- The 4-color theme palette: obsidian (#0D0A02), teal-steel (#1A434E), hill-green (#059D72), toxic-lime (#A2D729), terai-harvest (#A6A180), himalayan-mist (#F4F2F3) — all available as Tailwind classes.

When done, give me a one-sentence summary per task (5 sentences total) and the end-to-end test results for items 1, 2, and 5.

---

## After items 1–5 are done (next session after that)

- Add a `Hotel` model relationship so the booking page can let users pick a specific hotel (not just the destination)
- Build an email-confirmation flow for the booking (different from support — booking confirmations to the traveler)
- Add a "Cancel booking" button on the dashboard (PATCH status to `cancelled`)
- Refactor `Profile.jsx` so editing roles updates `profileData` cleanly (currently overlapping fields between top-level and nested)
