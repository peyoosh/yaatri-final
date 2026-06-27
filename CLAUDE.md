# Yaatri Hub — Claude Collaboration Preferences

## Token Efficiency
- Always run `/compact` proactively when the conversation grows long to minimize token usage, without sacrificing production quality or response clarity.
- Prefer targeted, surgical edits over full file rewrites. Only rewrite a file if more than ~60% of it is changing.
- Batch independent tool calls in parallel; never re-read a file you just edited.

## Handling Ambiguous Prompts
- If ANY part of a prompt is unclear, ambiguous, or could be interpreted in multiple ways — STOP before implementing.
- List the specific unclear points as numbered questions.
- Wait for the user to answer before writing any code or making any changes.
- Never assume or guess intent on functionality-level decisions (architecture, data model, UX flow). Only assume safe cosmetic defaults (e.g., which shade of blue to use).

## Always Verify Before Acting
- Before starting any non-trivial task, state in 2–3 sentences: what you are about to change, which files will be affected, and what the visible outcome will be.
- For destructive or hard-to-reverse actions (deleting routes, dropping fields, changing auth flow), always ask for explicit confirmation first.

## Code Style (Yaatri Hub Specific)
- Design system: Light slate theme (`#f8fafc` bg, `#0f172a` text). Admin stays dark (`#020617`).
- Brand tokens: `brand-blue #2563EB`, `brand-saffron #F59E0B`, `brand-green #10B981`, `brand-pink #DB2777`, `brand-slate #0F172A`.
- Tailwind v4 rules:
  - Never use custom `@theme` color tokens with opacity modifiers in gradient utilities (e.g. `from-brand-slate/75`). Use inline `linear-gradient()` with `rgba()` instead.
  - Never use arbitrary values like `min-h-[90vh]` for critical layout — use `style={{ minHeight: '90vh' }}`.
  - `max-w-7xl mx-auto` belongs on an INNER `<div>`, not on the `<section>` tag, so section backgrounds span full viewport width.
- No JSX comments (`{/* */}`) as siblings to JSX elements inside `return ()` — they cause parse errors in Vite.
- No inline comments explaining what code does. Only add a comment if the WHY is non-obvious.

## Project Context
- Stack: React 19 + Vite 8 + Tailwind v4 (frontend), Express 5 + Mongoose 9 + MongoDB Atlas (backend).
- Booking lifecycle: `pending_payment` → `escrow_held` → `approved` → `completed`. 15% platform commission, 20% cancellation forfeit, 4% state tax + 12% GST.
- GuideDashboard.jsx and HotelDashboard.jsx are intentionally orphaned — do not modify or delete.
- App.css has legacy unused styles — leave as-is.
- Local image `/nepal-bg.jpg` in public folder. Prefer this over external Unsplash URLs for hero sections.
