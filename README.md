# DevConnect — Developer Networking Platform

A full-stack social platform for developers: JWT auth, real-time chat via Socket.io, a post feed, and a searchable developer directory. Built with **React (Vite)**, **Node.js/Express**, **MongoDB (Mongoose)**, and **Socket.io** — deployable on **Vercel** (frontend) + **Render** (backend) with a GitHub Actions **CI/CD** pipeline.

---

## 1. Features

- **Authentication**: Email & password registration and login, passwords securely hashed using `bcryptjs`, 7-day signed JWTs stored in `localStorage`, backend `protect` route guard, and React `AuthContext` with automatic `GET /api/auth/me` session re-validation.
- **Post Feed**: Authenticated users can create text posts, optional code snippets, and custom technology tags. Includes like/unlike toggling, embedded comments with timestamps, owner deletion, and paginated feed loading.
- **Developer Directory**: Searchable list of registered developers with debounced search by name or skill, linked profiles with GitHub URLs, skills badges, and direct messaging shortcuts.
- **Real-time 1:1 Chat**: Direct messaging over Socket.io authenticated via JWT handshake (`io.use()`). Messages are persisted in MongoDB first, then pushed live to online recipients. Includes live typing indicator, presence tracking (`presence:update` and `presence:list`), and chat history retrieval.
- **Security & Ops**: Helmet security headers, Express rate limiting, centralized error and 404 handlers, `/api/health` uptime monitor, and a seed script creating 200 developers and sample posts.
- **CI/CD & Cloud Deploy Ready**: GitHub Actions build & deploy workflow, Render blueprint (`render.yaml`), and Vercel rewrite configuration (`vercel.json`).

---

## 2. Architecture & Folder Structure

```
devconnect/
├── README.md                          # Full project documentation & spec
├── .github/
│   └── workflows/
│       └── ci-cd.yml                  # GitHub Actions: build & Render deploy hook
│
├── backend/                           # Node.js / Express / MongoDB / Socket.io API
│   ├── server.js                      # App entry point (Express + HTTP + Socket.io)
│   ├── package.json
│   ├── .env.example                   # Environment variable template
│   ├── .gitignore
│   ├── render.yaml                    # Render deployment blueprint
│   ├── config/
│   │   └── db.js                      # MongoDB Mongoose connection
│   ├── models/
│   │   ├── User.js                    # User schema + password hashing
│   │   ├── Post.js                    # Feed post + embedded comments
│   │   └── Message.js                 # Persisted chat messages
│   ├── controllers/
│   │   ├── authController.js          # Register / login / me
│   │   ├── postController.js          # Feed CRUD, like, comment
│   │   └── userController.js          # Directory, profile, chat history
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── postRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── auth.js                    # JWT "protect" middleware
│   │   ├── validate.js                # express-validator result handler
│   │   └── errorHandler.js            # Centralized error + 404 handling
│   ├── socket/
│   │   └── socketHandler.js           # Socket.io auth, chat, presence
│   └── utils/
│       └── seedUsers.js               # Onboard ~200 sample users + posts
│
└── frontend/                          # React (Vite) client
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── vercel.json                    # SPA rewrite rule for Vercel
    ├── .env.example                   # Environment variable template
    ├── .gitignore
    └── src/
        ├── main.jsx                   # React root + router + AuthProvider
        ├── App.jsx                    # Route definitions + PrivateRoute guard
        ├── context/
        │   └── AuthContext.jsx        # Login/register/logout + session persistence
        ├── services/
        │   ├── api.js                 # Axios instance with JWT interceptor
        │   └── socket.js              # Authenticated Socket.io client
        ├── components/
        │   ├── Navbar.jsx             # Top navigation bar + mobile drawer
        │   └── PostCard.jsx           # Like / comment UI for feed items
        ├── pages/
        │   ├── Login.jsx              # Authentication login view
        │   ├── Register.jsx           # New account registration view
        │   ├── Feed.jsx               # Post feed + composer
        │   ├── Directory.jsx          # Searchable developer list
        │   ├── Profile.jsx            # View/edit developer profile
        │   └── Chat.jsx               # Real-time 1:1 chat
        └── styles/
            └── index.css              # Custom CSS design system & animations
```

---

## 3. Local Setup

### Prerequisites
- Node.js 18+
- MongoDB instance (MongoDB Atlas free tier or local MongoDB server)

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
```
Edit `.env` and provide your MongoDB connection string and JWT secret:
```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/devconnect?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

Install dependencies and start the backend:
```bash
npm install
npm run dev
```

*(Optional)* Seed 200 sample developers and posts (all sample accounts use password `password123`):
```bash
npm run seed
```

### 2. Frontend Setup
In a separate terminal window:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. API Reference

| Method | Route                          | Auth | Description                         |
|--------|---------------------------------|------|--------------------------------------|
| POST   | `/api/auth/register`            | –    | Create account, returns JWT          |
| POST   | `/api/auth/login`               | –    | Log in, returns JWT                  |
| GET    | `/api/auth/me`                  | ✓    | Current authenticated user           |
| GET    | `/api/posts?page=&limit=`       | ✓    | Paginated feed                       |
| POST   | `/api/posts`                    | ✓    | Create a post                        |
| PUT    | `/api/posts/:id/like`           | ✓    | Toggle like                          |
| POST   | `/api/posts/:id/comments`       | ✓    | Add a comment                        |
| DELETE | `/api/posts/:id`                | ✓    | Delete own post                      |
| GET    | `/api/users?search=`            | ✓    | Developer directory search           |
| GET    | `/api/users/:id`                | ✓    | Public profile                       |
| PUT    | `/api/users/me`                 | ✓    | Update own profile                   |
| GET    | `/api/users/:id/messages`       | ✓    | Chat history with user :id           |
| GET    | `/api/health`                   | –    | Health check for uptime monitoring   |

### Socket.io Real-Time Events

| Event             | Direction       | Payload                             | Description                             |
|-------------------|-----------------|-------------------------------------|-----------------------------------------|
| `chat:send`       | client → server | `{ receiverId, text }`              | Sends direct message                    |
| `chat:receive`    | server → client | Persisted Message document          | Incoming message to recipient           |
| `chat:sent`       | server → client | Persisted Message document          | Echo confirmation back to sender        |
| `chat:typing`     | client → server | `{ receiverId }`                    | Broadcast typing notice                 |
| `chat:typing`     | server → client | `{ senderId }`                      | Received typing indicator               |
| `presence:list`   | server → client | `string[]` (userId array)           | Initial online users list on connection |
| `presence:update` | server → client | `{ userId, isOnline }`              | User connection/disconnection broadcast |

---

## 5. Deployment Guide

### Backend → Render
1. Push repository to GitHub.
2. In Render dashboard: **New +** → **Blueprint** → Select repo. Render detects `backend/render.yaml`.
3. Set environment variables in the Render dashboard:
   - `MONGO_URI`: Your MongoDB connection URI.
   - `JWT_SECRET`: Random 64-char secret key.
   - `CLIENT_URL`: Your deployed frontend Vercel URL.
4. Render monitors `/api/health` automatically for health status.
5. Create a **Deploy Hook** in Render service settings and save as GitHub secret `RENDER_DEPLOY_HOOK_URL`.

### Frontend → Vercel
1. In Vercel: Import git repository.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variables:
   - `VITE_API_URL`: `https://<your-render-backend-url>/api`
   - `VITE_SOCKET_URL`: `https://<your-render-backend-url>`
4. Deploy. `vercel.json` ensures client-side routing rewrites all routes to `/index.html`.

### CI/CD Pipeline
`.github/workflows/ci-cd.yml` triggers on every push and PR to `main`:
- Installs dependencies and verifies backend code syntax.
- Installs dependencies and builds the production frontend bundle (`npm run build`).
- Triggers the Render Deploy Hook on merge to `main`.
