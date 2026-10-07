# ISMO Project Management System - Backend API

A secure, modular REST API built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM** as specified in the internship project assessment.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (Local PostgreSQL server, Docker, or hosted instance such as Neon / Supabase)

### 2. Installation
```bash
cd backend
npm install
```

### 3. PostgreSQL Database Setup
Configure your database connection string in `.env`:
```env
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database_name>?schema=public"
```

#### If using Local PostgreSQL:
1. Ensure your PostgreSQL service is running on port 5432.
2. Create a database named `ismo_db` (or name of your choice).

#### If using Free Cloud PostgreSQL (Zero local installation):
You can create a free database on [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com) in 30 seconds and paste the connection string into `DATABASE_URL`.

### 4. Create Tables & Seed Data
```bash
# Push schema to PostgreSQL (creates users, projects, and tasks tables)
npm run prisma:push

# (Optional) Seed realistic demo user, projects, and tasks
npm run seed
```

### 5. Start the Server
```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```
The server will run on **`http://localhost:5000`**.  
Health check endpoint: **`http://localhost:5000/api/health`**.

### 6. Visual Database Viewer (Prisma Studio)
```bash
npm run prisma:studio
```
Opens an interactive GUI at **`http://localhost:5555`** where you can inspect, filter, edit, and create records directly in your PostgreSQL database.

---

## 🔒 Security Features Implemented
- **Password Security**: Passwords hashed using `bcryptjs` with salt rounds = 10. Plain text is never stored or returned.
- **JWT Authentication**: Secure Bearer tokens with configurable expiration (`JWT_EXPIRES_IN=7d`).
- **Authorization & Data Isolation**: Users can only read, edit, or delete their own projects and tasks. Attempts to access others' resources return 404/403.
- **SQL Injection Prevention**: 100% parameterization handled through Prisma ORM. Raw unsanitized queries are prohibited.
- **Brute-Force Rate Limiting**: Authentication endpoints are rate-limited (`express-rate-limit`) to prevent credential stuffing.
- **CORS Configuration**: Restricted to trusted frontend origins and mobile clients.
- **Centralized Error Handling**: Uniform JSON error responses that never leak server stack traces in production.

---

## 📚 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user (`name`, `email`, `password`) | No (Rate-limited) |
| `POST` | `/api/auth/login` | Sign in with email & password | No (Rate-limited) |
| `POST` | `/api/auth/logout` | Sign out session | No |
| `GET` | `/api/auth/me` | Get currently logged-in user profile | Yes (Bearer Token) |

### Projects (`/api/projects`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | Get all projects owned by user (with `search` & `status` filters) | Yes |
| `GET` | `/api/projects/:id` | Get project details and all tasks under it | Yes |
| `POST` | `/api/projects` | Create new project (`name`, `description`, `status`, `startDate`, `endDate`) | Yes |
| `PUT` | `/api/projects/:id` | Update project fields | Yes |
| `DELETE` | `/api/projects/:id` | Delete project and cascade-delete its tasks | Yes |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Get all tasks owned by user (filter by `projectId`, `status`, `priority`, `search`) | Yes |
| `GET` | `/api/tasks/:id` | Get single task details | Yes |
| `POST` | `/api/tasks` | Create task (`projectId`, `name`, `description`, `priority`, `status`, `dueDate`) | Yes |
| `PUT` | `/api/tasks/:id` | Update task fields (e.g. mark as `Completed`) | Yes |
| `DELETE` | `/api/tasks/:id` | Delete task | Yes |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Returns user stats: `totalProjects`, `totalTasks`, `completedTasks`, `pendingTasks`, `projectsInProgress` | Yes |

