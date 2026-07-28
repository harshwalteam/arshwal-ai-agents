# Harshwal AI Agent Services — Workpaper (Full Stack)

A working tool (frontend + backend) to pitch, scope, and demo Harshwal's move
into AI Agent implementation and managed services.

## What's inside

```
harshwal-ai-agents/
├── backend/          Express server — API + business logic
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/          Static site — served by the backend
│   ├── index.html
│   ├── style.css
│   └── app.js
└── README.md
```

## Features

1. **Positioning** — the AI Agent services thesis and open decisions
2. **Live Agent Demo** — a real chat with any of six AI Agent personas
   (Customer Support, Voice/Receptionist, Email, Reporting, Tax/Compliance,
   Knowledge/Workflow), proxied through the backend at `/api/chat` (your API
   key stays server-side)
3. **Pricing / ROI Calculator** — cost logic runs on the backend at `/api/roi`
4. **Roadmap** — suggested 4-phase rollout plan

## Setup

**1. Install dependencies**
```bash
cd backend
npm install
```

**2. Add your free Gemini API key**
```bash
cp .env.example .env
```
Open `.env` and set:
```
GEMINI_API_KEY=your_key_here
```
Get a **free** key (no credit card needed) from https://aistudio.google.com/apikey
— sign in with any Google account and click "Create API key".

**3. Run the server**
```bash
npm start
```

**4. Open the app**
Visit **http://localhost:4000** — this serves the frontend and exposes the API.

> The Pricing/ROI Calculator and Roadmap tabs work immediately.
> The Live Agent Demo tab needs a valid `GEMINI_API_KEY` to respond.

## Deploying for free (no server of your own needed)

The easiest free option is **Render.com** — a Node app with a real backend,
free tier, no credit card needed for the basic plan.

### Option A — Render (recommended)

1. **Put this project on GitHub**
   - Create a free GitHub account if you don't have one: https://github.com/signup
   - Create a new empty repository (e.g. `harshwal-ai-agents`)
   - From this project folder, run:
     ```bash
     git init
     git add .
     git commit -m "Harshwal AI Agent Services workpaper"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/harshwal-ai-agents.git
     git push -u origin main
     ```

2. **Create a free Render account**: https://render.com (sign up with GitHub — no card required)

3. **New + → Blueprint** → connect your `harshwal-ai-agents` repo.
   Render will read the included `render.yaml` and pre-fill everything
   (root directory `backend`, build command `npm install`, start command `npm start`).

   *(No `render.yaml`? Use "New + → Web Service" instead, connect the repo, and
   set: Root Directory = `backend`, Build Command = `npm install`,
   Start Command = `npm start`.)*

4. When asked for environment variables, add:
   ```
   GEMINI_API_KEY = your_key_here
   ```
   (get one free, no card needed, from https://aistudio.google.com/apikey)

5. Click **Deploy**. Render gives you a free URL like
   `https://harshwal-ai-agents.onrender.com` — open it, the whole tool
   (frontend + backend + live agent demo) runs from there.

> Free-tier note: the app "sleeps" after ~15 minutes of no traffic and takes
> ~30–50 seconds to wake up on the next visit. Fine for internal use or demos;
> upgrade to a paid instance later if you need it always-on for client pitches.

### Option B — Railway (alternative)

1. Push the same repo to GitHub (steps above).
2. Go to https://railway.app → sign up free → **New Project → Deploy from GitHub repo**.
3. Set the root directory to `backend` in the service settings.
4. Add the `GEMINI_API_KEY` environment variable.
5. Railway builds and gives you a public URL automatically.

Both platforms redeploy automatically every time you `git push` new changes.

## API reference

| Method | Route         | Purpose                                              |
|--------|---------------|-------------------------------------------------------|
| GET    | `/api/health` | Health check                                           |
| GET    | `/api/data`   | Returns agent catalogue, size multipliers, chat personas |
| POST   | `/api/roi`    | Body: `{ size, agentIds[] }` → cost/ROI estimate       |
| POST   | `/api/chat`   | Body: `{ messages[], agentType }` → AI agent reply     |

## Customizing for a real client pitch

- Edit `AGENTS` and `INDUSTRIES` in `backend/server.js` to adjust fit ratings,
  pricing assumptions, and service-line alignment notes.
- Edit the `system` prompt inside the `/api/chat` route (in `AGENT_PERSONAS`) to
  adjust tone or scope for any of the six agent personas.
- All pricing in `/api/roi` is illustrative — replace `baseLow`/`baseHigh` and
  the AMC percentage with Harshwal's actual delivery costs before quoting.

## Notes

- This is a self-contained Node.js project — it is not hosted anywhere;
  you (or your IT/dev team) run it locally or deploy it to your own server.
- Never commit your real `.env` file — it contains your API key.
