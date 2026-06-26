# Task Board

A full-stack task management application built as a Full Stack Developer assignment.

---

## Project Overview

Task Board allows users to sign up, log in, create tasks, view their own tasks, and update task statuses. The application demonstrates full-stack fundamentals using the modern Next.js App Router with manual JWT authentication and a PostgreSQL database through Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Authentication | Manual JWT (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Validation | `zod` |

---

## Authentication Flow

1. **Signup** — User submits name, email, and password.
2. Password is hashed using `bcryptjs` before storage. Plain-text passwords are never stored.
3. A JWT token is signed with `JWT_SECRET` and stored in a secure **HTTP-only cookie** (`token`, 7-day expiry).
4. **Login** — User submits email and password. The stored hash is compared using `bcrypt.compare`. On success, a new JWT cookie is set.
5. **Protected routes** — The `proxy.ts` file (Next.js 16 server middleware) reads the `token` cookie on every request. If missing, the user is redirected to `/login`. Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`.
6. **Logout** — Clears the HTTP-only cookie by setting it to an expired date.

---

## Database Schema

### User

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary Key |
| name | String | Required |
| email | String | Unique |
| password | String | Bcrypt hashed |
| createdAt | DateTime | Auto |

### Task

| Field | Type | Notes |
|---|---|---|
| id | String (UUID) | Primary Key |
| title | String | Required |
| status | String | `Todo` \| `In Progress` \| `Done` |
| userId | String | Foreign Key → User.id |
| createdAt | DateTime | Auto |

**Relationship**: One User → Many Tasks

---

## Installation Steps

### Prerequisites

- Node.js 18+
- npm

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd task-board

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# 4. Generate Prisma client
npx prisma generate

# 5. Start the development server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres
JWT_SECRET=your-secure-random-secret-here
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |

---

## Local Development Instructions

```bash
# Start the development server (with hot reload)
npm run dev

# Open the app
# http://localhost:3000

# Run ESLint
npm run lint

# Build for production
npm run build
```

The root URL `/` automatically redirects to `/dashboard`. If not authenticated, the dashboard redirects to `/login`.

---

## Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── signup/route.ts     POST — Register new user
│   │   ├── login/route.ts      POST — Authenticate user
│   │   └── logout/route.ts     POST — Clear session cookie
│   └── tasks/
│       ├── route.ts            GET + POST — List / Create tasks
│       └── [id]/route.ts       PATCH — Update task status
├── signup/
│   └── page.tsx                Public signup page
├── login/
│   └── page.tsx                Public login page
├── dashboard/
│   ├── page.tsx                Protected dashboard (server component)
│   └── DashboardClient.tsx     Interactive dashboard (client component)
├── globals.css
└── layout.tsx

lib/
├── prisma.ts                   Prisma Client singleton
├── jwt.ts                      JWT sign / verify helpers
└── auth.ts                     getAuthUser() from cookie

prisma/
└── schema.prisma               Database models (User, Task)

prisma.config.ts                Prisma 7 datasource configuration
proxy.ts                        Route protection (Next.js 16 middleware)
```

---

## API Overview

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Log in, receive JWT cookie | No |
| POST | `/api/auth/logout` | Clear JWT cookie | No |

**Signup Request Body**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

**Login Request Body**
```json
{ "email": "john@example.com", "password": "secret123" }
```

### Tasks

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| GET | `/api/tasks` | Get all tasks for authenticated user | Yes |
| POST | `/api/tasks` | Create a new task | Yes |
| PATCH | `/api/tasks/:id` | Update task status | Yes |

**Create Task Request Body**
```json
{ "title": "My Task" }
```

**Update Task Status Request Body**
```json
{ "status": "In Progress" }
```

Allowed status values: `Todo`, `In Progress`, `Done`

All authenticated routes validate the JWT cookie. Each task is scoped to the authenticated user — users cannot read or modify another user's tasks.

---

## Live URL

Optional — deploy to [Vercel](https://vercel.com) by connecting the repository. (Note: Make sure to configure the DATABASE_URL with the connection pooler on port 6543 for serverless environments).
