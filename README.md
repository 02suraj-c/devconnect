# DevConnect — Developer Networking Platform

A full-stack social platform for developers: JWT auth, real-time chat via
Socket.io, a post feed, and a searchable developer directory. Built with
**React (Vite)**, **Node.js/Express**, **MongoDB (Mongoose)**, and
**Socket.io** — deployed on **Vercel** (frontend) + **Render** (backend)
with a GitHub Actions **CI/CD** pipeline.

---

## 1. Project prompt / brief (for re-generating or extending this project)

> Build a full-stack developer social network called "DevConnect".
> Stack: React + Vite frontend, Node.js/Express backend, MongoDB via
> Mongoose, Socket.io for real-time features.
>
> **Auth**: email/password registration and login, passwords hashed with
> bcrypt, sessions handled via signed JWTs (7-day expiry), a `protect`
> middleware that guards private routes, and a React `AuthContext` that
> persists the session in `localStorage` and re-validates it against
> `GET /api/auth/me` on load.
>
> **Post feed**: authenticated users can create text posts (optionally with
> an attached code snippet and tags), like/unlike posts, and comment on
> them. The feed is paginated and sorted newest-first.
>
> **Developer directory**: a searchable list of all registered users
> (search by name or skill), each with a public profile page (bio, skills,
> GitHub link, editable by its owner).
>
> **Real-time chat**: one-to-one messaging over Socket.io, authenticated at
> the socket handshake via the same JWT used for REST calls. Messages are
> persisted in MongoDB first, then pushed live to the recipient if they're
> online; includes a typing indicator and an online/offline presence flag
> broadcast to all connected clients.
>
> **Ops**: a seed script to onboard ~200 sample developer accounts plus
> sample posts for demo/staging; a `/api/health` endpoint for uptime
> checks; centralized error handling; rate limiting and `helmet` security
> headers; environment-variable-driven config (`.env.example` provided for
> both apps); a `render.yaml` blueprint for the backend and a
> `vercel.json` rewrite rule for the frontend SPA; and a GitHub Actions
> workflow that installs/builds both apps on every push/PR and pings a
> Render deploy hook on merges to `main` (Vercel deploys via its own git
> integration).
>
> Every file should be commented to explain *why*, not just *what*, so the
> codebase is easy to extend (e.g. why passwords use `select: false`, why
> messages are persisted before being emitted, why Socket.io auth happens
> in `io.use()` rather than per-event).

---

## 2. Folder structure

```
devconnect/
├── README.md                          # this file — full project spec
├── .github/
│   └── workflows/
│       └── ci-cd.yml                  # GitHub Actions: build + deploy hooks
│
├── backend/                           # Node.js / Express / MongoDB / Socket.io API
│   ├── server.js                      # app entry point (Express + HTTP + Socket.io)
│   ├── package.json
│   ├── .env.example                   # copy to .env
│   ├── .gitignore
│   ├── render.yaml                    # Render deployment blueprint
│   ├── config/
│   │   └── db.js                      # MongoDB connection
│   ├── models/
│   │   ├── User.js                    # user schema + password hashing
│   │   ├── Post.js                    # feed post + embedded comments
│   │   └── Message.js                 # persisted chat messages
│   ├── controllers/
│   │   ├── authController.js          # register / login / me
│   │   ├── postController.js          # feed CRUD, like, comment
│   │   └── userController.js          # directory, profile, chat history
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── auth.js                    # JWT "protect" middleware
│   │   ├── validate.js                # express-validator result handler
│   │   └── errorHandler.js            # centralized error + 404 handling
│   ├── socket/
│   │   └── socketHandler.js           # Socket.io auth, chat, presence
│   └── utils/
│       └── seedUsers.js               # onboard ~200 sample users + posts
│
└── frontend/                          # React (Vite) client
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json                    # SPA rewrite rule for Vercel
    ├── .env.example                   # copy to .env
    ├── .gitignore
    └── src/
        ├── main.jsx                   # React root + router + AuthProvider
        ├── App.jsx                    # route definitions + PrivateRoute guard
        ├── context/
        │   └── AuthContext.jsx        # login/register/logout + session persistence
        ├── services/
        │   ├── api.js                 # axios instance with JWT interceptor
        │   └── socket.js              # authenticated Socket.io client
        ├── components/
        │   ├── Navbar.jsx
        │   └── PostCard.jsx           # like / comment UI for one post
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Feed.jsx               # post feed + composer
        │   ├── Directory.jsx          # searchable developer list
        │   ├── Profile.jsx            # view/edit a developer profile
        │   └── Chat.jsx               # real-time 1:1 chat
        └── styles/
            └── index.css
```

---

## 3. Local setup

### Prerequisites
- Node.js 18+
- A MongoDB connection string (MongoDB Atlas free tier works fine)

### Backend
```bash
cd backend
cp .env.example .env      # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                # starts on http://localhost:5000
npm run seed                # optional: onboard ~200 sample users + posts
```

### Frontend
```bash
cd frontend
cp .env.example .env      # defaults already point at localhost:5000
npm install
npm run dev                # starts on http://localhost:5173
```

Open `http://localhost:5173`, register an account, and you're in.

---

## 4. Deployment

### Backend → Render
1. Push this repo to GitHub.
2. In Render: **New +** → **Blueprint**, point it at the repo — it will
   read `backend/render.yaml` automatically.
3. Set the secret env vars in the Render dashboard: `MONGO_URI`,
   `JWT_SECRET`.
4. Update `CLIENT_URL` (in `render.yaml` or the dashboard) to your real
   Vercel URL once you have it, so CORS allows the frontend origin.
5. Create a **Deploy Hook** for the service and save it as the
   `RENDER_DEPLOY_HOOK_URL` GitHub Actions secret (used by `ci-cd.yml`).

### Frontend → Vercel
1. Import the repo in Vercel, set the **root directory** to `frontend`.
2. Vercel auto-detects the Vite build (`npm run build`, output `dist`).
3. Set project env vars: `VITE_API_URL` (your Render URL + `/api`) and
   `VITE_SOCKET_URL` (your Render URL).
4. Vercel deploys automatically on every push to `main` via its GitHub
   integration.

### CI/CD (GitHub Actions)
`.github/workflows/ci-cd.yml` runs on every push/PR to `main`:
installs and builds both apps (catching broken builds before they ship),
then on a push to `main` pings the Render deploy hook. Add these repo
secrets: `VITE_API_URL`, `VITE_SOCKET_URL`, `RENDER_DEPLOY_HOOK_URL`.

### Uptime
`GET /api/health` returns `{ success: true, status: "ok", uptime }` and
is wired up as Render's health-check path — pair it with an external
monitor (UptimeRobot, Better Stack, etc.) if you want uptime tracked and
reported independently of Render's own dashboard.

---

## 5. API reference (summary)

| Method | Route                          | Auth | Description                         |
|--------|---------------------------------|------|--------------------------------------|
| POST   | `/api/auth/register`            | –    | Create account, returns JWT          |
| POST   | `/api/auth/login`                | –    | Log in, returns JWT                  |
| GET    | `/api/auth/me`                   | ✓    | Current user                         |
| GET    | `/api/posts?page=&limit=`        | ✓    | Paginated feed                       |
| POST   | `/api/posts`                     | ✓    | Create a post                        |
| PUT    | `/api/posts/:id/like`            | ✓    | Toggle like                          |
| POST   | `/api/posts/:id/comments`        | ✓    | Add a comment                        |
| DELETE | `/api/posts/:id`                 | ✓    | Delete own post                      |
| GET    | `/api/users?search=`             | ✓    | Developer directory                  |
| GET    | `/api/users/:id`                 | ✓    | Public profile                       |
| PUT    | `/api/users/me`                  | ✓    | Update own profile                   |
| GET    | `/api/users/:id/messages`        | ✓    | Chat history with user :id           |
| GET    | `/api/health`                    | –    | Health check for uptime monitoring   |

**Socket.io events**
| Event            | Direction        | Payload                          |
|------------------|------------------|-----------------------------------|
| `chat:send`      | client → server  | `{ receiverId, text }`            |
| `chat:receive`   | server → client  | persisted message document        |
| `chat:sent`      | server → client  | echo of the sender's own message  |
| `chat:typing`    | both directions  | `{ receiverId }` / `{ senderId }` |
| `presence:update`| server → client  | `{ userId, isOnline }`            |

Socket auth: the client connects with `io(url, { auth: { token } })`; the
server verifies the JWT in `io.use()` before allowing the connection.

---

## 6. Notes on the "200+ test users" and "99.5% uptime" claims

- `backend/utils/seedUsers.js` generates the sample accounts (default
  200) and sample posts referenced in the project summary — run
  `npm run seed` after connecting a real database.
- Uptime is a property of your actual deployment (Render's dashboard, or
  an external monitor hitting `/api/health`) rather than something the
  code can assert on its own — this repo gives you the health-check
  endpoint and Render blueprint needed to measure and maintain it.
