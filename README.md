# CodeQuest

CodeQuest is a MERN developer progress app. The current build provides account registration/login, a personal dashboard, coding platform baselines, an activity log, goals, a starter achievements collection, a community leaderboard, profile settings, and portfolio customization.

## Run locally

Requirements: Node.js 20+ and MongoDB (local MongoDB or an Atlas connection string).

1. Copy `.env.example` to `.env` in this folder and set `MONGODB_URI` and a long random `JWT_SECRET`.
2. Install dependencies from the project root: `npm install`, `npm --prefix server install`, and `npm --prefix client install`.
3. Start the development servers: `npm run dev`.
4. Open `http://localhost:5173`. The API listens on `http://localhost:5000`; `GET /api/health` is the health check.

For a production frontend build run `npm run build`. Set `CLIENT_URL` to the deployed frontend origin and set `VITE_API_URL` at client build time to the deployed API base, such as `https://api.example.com/api`. Run the backend with `npm start`.

## Data and integration status

Codeforces profiles can be synced by username from Codeforces' documented public API. This imports public profile fields and rating; looking up a username does not prove account ownership. LeetCode scraping is intentionally not used because its Terms prohibit crawling and scraping. CodeChef and GeeksforGeeks username sync are not implemented yet. Manual platform baselines remain available through the API; they are labeled unverified. Activity logs are manual and do not count toward verified streaks. GitHub OAuth/API sync, contest feeds, email based password reset, Gemini insights, social features and battle administration need provider credentials or additional implementation before they can be enabled.

The current developer score and leaderboard are simple progress indicators, not skill or employability assessments. XP and verified streaks remain zero until trusted activity sources are connected.

## API overview

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `PATCH /api/profile`
- `GET /api/dashboard`
- `GET/POST /api/platforms`, `POST /api/platforms/sync`, `DELETE /api/platforms/:id`
- `GET/POST /api/activity`
- `GET/POST /api/goals`, `PATCH /api/goals/:id/progress`, `DELETE /api/goals/:id`
- `GET /api/leaderboard`
- `GET/PUT /api/portfolio`, `GET /api/public/:username`
- `GET /api/health`

Authenticated endpoints accept `Authorization: Bearer <jwt>`. API errors return a JSON `message`.

## Deployment configuration

Backend: Node.js host (Render or equivalent), with `PORT`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL` set. Frontend: static Vite host (Vercel or equivalent), with `VITE_API_URL` set at build time. Database: MongoDB Atlas; allow the backend host's network access and use a least-privilege database user. Do not commit `.env` or provider secrets.

## Current scope

This is a working initial product foundation. It is not yet the full feature list in the supplied master prompt; the integrations that require verification or external credentials are explicitly not represented as complete.
"# CodeQuest" 
