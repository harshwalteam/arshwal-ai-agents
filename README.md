# Harshwal AI Agent Services — Workpaper (Full Stack)

A working tool (frontend + backend) to pitch, scope, and demo Harshwal's move
into AI Agent implementation and managed services.

This repo can be run two ways:
- **Locally / on Render** using the Express server in `backend/`
- **On Vercel (free, no card needed)** using the serverless functions in `api/`
  and the static site at the repo root (`index.html`, `style.css`, `app.js`)

Both versions share the same look, features, and Gemini-powered chat demo.

## What's inside

```
harshwal-ai-agents/
├── api/               Vercel serverless functions (used for Vercel deploys)
│   ├── health.js
│   ├── data.js
│   ├── roi.js
│   └── chat.js
├── lib/
│   └── agents.js       Shared agent/pricing data used by the api/ functions
├── backend/            Express server (used for local / Render deploys)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/            Static site served by the Express backend
│   ├── index.html
│   ├── style.css
│   └── app.js
├── index.html, style.css, app.js   Root copies served directly by Vercel
├── package.json         Root manifest (Vercel/Glitch-style platforms)
├── render.yaml           Render blueprint (Option B)
└── README.md
```

## Features

1. **Positioning** — the AI Agent services thesis and open decisions
2. **Live Agent Demo** — a real chat with any of six AI Agent personas
   (Customer Support, Voice/Receptionist, Email, Reporting, Tax/Compliance,
   Knowledge/Workflow), proxied through a backend endpoint at `/api/chat`
   (your Gemini API key stays server-side)
3. **Pricing / ROI Calculator** — cost logic runs server-side at `/api/roi`
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

## Deploying for free, no card required

### Option A — Vercel (recommended, genuinely free, no card)

Vercel serves the root static files (`index.html`, `style.css`, `app.js`) and
runs the `api/` folder as serverless functions automatically — zero config.

1. **Put this project on GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Harshwal AI Agent Services workpaper"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/harshwal-ai-agents.git
   git push -u origin main
   ```

2. Go to **https://vercel.com** → **Sign Up** → choose **"Continue with GitHub"**
   (no card is asked for the free Hobby plan).

3. On your dashboard, click **"Add New..." → "Project"**.

4. Find and **Import** your `harshwal-ai-agents` (or `arshwal-ai-agents`) repo.

5. Before deploying, expand **"Environment Variables"** and add:
   ```
   GEMINI_API_KEY = your_key_here
   ```
   (get one free, no card needed, from https://aistudio.google.com/apikey)

6. Click **Deploy**. In under a minute you'll get a free live URL like
   `https://arshwal-ai-agents.vercel.app` — open it, the whole tool
   (positioning, live agent demo, ROI calculator, roadmap) runs from there.

Every time you push new changes to GitHub, Vercel redeploys automatically.

### Option B — Render (needs card for identity verification)

Render also has a free tier, but currently requires adding a card for a $1
temporary identity-verification hold (you are not charged for the free tier
itself). Use this only if Vercel doesn't work for you.

1. Push the repo to GitHub (steps above).
2. Go to https://render.com → sign up with GitHub.
3. **New + → Blueprint** → connect your repo. Render reads the included
   `render.yaml` and pre-fills everything (root directory `backend`, build
   command `npm install`, start command `npm start`).
4. Add the environment variable `GEMINI_API_KEY = your_key_here`.
5. Click **Deploy** — you'll get a free URL like
   `https://harshwal-ai-agents.onrender.com`.

> Free-tier note: the app "sleeps" after ~15 minutes of no traffic and takes
> ~30–50 seconds to wake up on the next visit.

## API reference

| Method | Route         | Purpose                                                  |
|--------|---------------|-----------------------------------------------------------|
| GET    | `/api/health` | Health check                                               |
| GET    | `/api/data`   | Returns agent catalogue, size multipliers, chat personas   |
| POST   | `/api/roi`    | Body: `{ size, agentIds[] }` → cost/ROI estimate           |
| POST   | `/api/chat`   | Body: `{ messages[], agentType }` → AI agent reply         |


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
