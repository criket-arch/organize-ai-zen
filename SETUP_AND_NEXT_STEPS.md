# Taiskmaster — Setup & Next Steps

A fast, AI-assisted task and appointment manager. This guide gets you running and explains exactly where to extend the app.

---

## 1. What's in the box (MVP)

The current build is a **fully working frontend MVP** with:

- Beautiful, responsive dashboard (cards, sorting, search)
- Task CRUD (create / edit / delete / complete)
- Mini calendar with date filtering and task dots
- **Smart Schedule Optimizer** (rule-based: groups by location, orders by priority, fills empty slots)
- **Floating AI Assistant** (rule-based fallback — structured so OpenAI can be plugged in)
- `/admin` panel with task table, JSON export, and bulk clear
- Local persistence via `localStorage` (no backend required to try it)

> The original spec asked for Next.js + FastAPI + PostgreSQL. Lovable projects use **React + Vite + TypeScript + Tailwind + shadcn/ui**, so this MVP ships on that stack with localStorage. Section 5 explains how to plug in the FastAPI/PostgreSQL backend (or, more simply, Lovable Cloud) later.

---

## 2. Quick start (frontend only)

```bash
# 1. Install
npm install

# 2. Run dev server
npm run dev
# → http://localhost:8080

# 3. Build for production
npm run build
npm run preview
```

That's it. Open `http://localhost:8080` for the dashboard, `http://localhost:8080/admin` for the admin panel.

No environment variables are required for the MVP.

---

## 3. Project structure

```
src/
├── components/
│   ├── ui/                  # shadcn primitives (button, dialog, table, ...)
│   ├── Header.tsx           # Top nav (logo, nav links, actions)
│   ├── TaskCard.tsx         # Single task card with hover actions
│   ├── TaskDialog.tsx       # Create / edit modal
│   ├── MiniCalendar.tsx     # Sidebar calendar with task indicators
│   └── AIAssistant.tsx      # Floating bottom-right chat assistant
├── pages/
│   ├── Index.tsx            # Main dashboard
│   ├── Admin.tsx            # /admin — task table + tools
│   └── NotFound.tsx
├── lib/
│   └── taskStore.ts         # Hooks, sorting, optimizeSchedule()
├── types/
│   └── task.ts              # Task / Priority / SortMode types
├── index.css                # Design tokens (HSL), gradients, animations
└── App.tsx                  # Routes
tailwind.config.ts           # Theme: colors, shadows, easings, animations
```

**Design system rule:** never write raw colors (`text-white`, `bg-blue-500`) in components. All colors live as HSL tokens in `src/index.css` and are exposed through `tailwind.config.ts`.

---

## 4. How to extend the frontend

| You want to… | Change this |
|---|---|
| Add a new task field | `src/types/task.ts` → then `TaskDialog.tsx` & `TaskCard.tsx` |
| Tweak optimization logic | `src/lib/taskStore.ts` → `optimizeSchedule()` |
| Add a new sort mode | `src/types/task.ts` (`SortMode`) → `sortTasks()` → dropdown in `Index.tsx` |
| Add a new page/route | Create `src/pages/Foo.tsx`, then add `<Route>` in `src/App.tsx` **above** the catch-all `*` route |
| Restyle anything | `src/index.css` (tokens) and `tailwind.config.ts` (theme) — don't hardcode in components |

---

## 5. Adding a real backend

You have **two paths**. Pick whichever fits your team.

### Path A — Lovable Cloud (recommended, fastest)

Lovable Cloud gives you Postgres, auth, storage, and edge functions with zero setup.

1. In Lovable, ask: *"Enable Lovable Cloud."*
2. Create a `tasks` table (the assistant will scaffold migrations + RLS policies).
3. Replace `src/lib/taskStore.ts` reads/writes with Cloud client calls. The hook signature stays the same so the UI doesn't change.
4. Add real auth (email / Google / Apple) when you're ready — see Section 6.

### Path B — Custom FastAPI + PostgreSQL

If you specifically want a Python backend:

```
backend/
├── app/
│   ├── main.py              # FastAPI app + CORS
│   ├── database.py          # SQLAlchemy engine + session
│   ├── models.py            # Task ORM model
│   ├── schemas.py           # Pydantic models
│   └── routers/tasks.py     # GET/POST/PATCH/DELETE /api/tasks
├── requirements.txt
└── .env
```

`requirements.txt`:
```
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-dotenv
pydantic
```

Run it:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

PostgreSQL setup:
```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16
createdb taiskmaster

# Ubuntu
sudo apt install postgresql && sudo systemctl start postgresql
sudo -u postgres createdb taiskmaster
```

`.env` for backend:
```
DATABASE_URL=postgresql://localhost:5432/taiskmaster
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=http://localhost:8080
```

`.env` for frontend (create `.env.local`):
```
VITE_API_URL=http://localhost:8000
```

Then in `src/lib/taskStore.ts`, swap `localStorage` calls for `fetch(${import.meta.env.VITE_API_URL}/api/tasks)`. Keep the `useTasks` hook signature identical so no component changes are needed.

---

## 6. Plugging in real AI

The assistant lives in `src/components/AIAssistant.tsx`. The single function `runAssistant(input, ctx)` is the entire integration point.

**Recommended (Lovable Cloud + AI Gateway):**

1. Enable Lovable Cloud.
2. Create an edge function `chat` that calls the AI Gateway (`google/gemini-2.5-flash` is free).
3. Replace `runAssistant` body with:

```ts
const res = await fetch("/functions/v1/chat", {
  method: "POST",
  body: JSON.stringify({ messages, tasks }),
});
const { reply, actions } = await res.json();
// apply actions: addTask / updateTask / replaceAll(optimizeSchedule(...))
return reply;
```

**Direct OpenAI (FastAPI path):**

Add `POST /api/chat` to FastAPI that calls `openai.chat.completions.create(...)` with the user's tasks as context. **Never call OpenAI directly from the browser** — your API key would leak.

---

## 7. Where the scheduling logic lives

`src/lib/taskStore.ts` → `optimizeSchedule(tasks)`:

1. Group tasks by date.
2. Within each day, cluster tasks that share a location (cuts travel).
3. Order clusters by their highest-priority item.
4. Inside a cluster, sort by priority then time.
5. Fill missing times starting at 09:00, with a 15-min buffer between locations.

Swap this for ML / OR-tools / a real solver when needed — the function signature `(Task[]) => Task[]` is the contract the rest of the app relies on.

---

## 8. Recommended next steps

1. **Auth** — wire Lovable Cloud auth or Supabase auth. Gate `/admin` behind a `has_role(user, 'admin')` check (use a separate `user_roles` table — never store roles on the profile).
2. **Real AI** — Section 6.
3. **Notifications** — browser push via `Notification` API for tasks within the next hour; later, add server-sent reminders or email.
4. **Recurring tasks** — add `recurrence: 'daily' | 'weekly' | { rrule: string }` to the Task type.
5. **Drag-and-drop reordering** — `dnd-kit` plays nicely with the existing card grid.
6. **Deployment**
   - Frontend: Vercel, Netlify, Cloudflare Pages, or Lovable's built-in publish.
   - Backend (if you went FastAPI): Fly.io, Railway, Render.
   - DB: Neon, Supabase, or managed Postgres on your cloud.

---

## 9. Common issues & fixes

| Problem | Fix |
|---|---|
| Port 8080 already in use | Kill the process or change `server.port` in `vite.config.ts` |
| Calendar dropdown won't click | The calendar must include `pointer-events-auto` — already set in `MiniCalendar.tsx` |
| "Tasks reset every refresh" | LocalStorage is per-browser. For real persistence, follow Section 5. |
| Dark mode looks off | Tokens are defined under `.dark` in `index.css`. Toggle by adding/removing `dark` class on `<html>`. |
| TS error on import | Use the `@/` alias (`@/components/...`) — configured in `vite.config.ts` & `tsconfig.json`. |
| FastAPI CORS error | Add your frontend URL to `ALLOWED_ORIGINS` and pass it to FastAPI's `CORSMiddleware`. |
| `psycopg2` install fails | Use `psycopg2-binary` instead, or install `libpq-dev` first. |

---

Have fun building. Keep the design system tight, keep components small, and ship often. ✨
