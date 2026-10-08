# ISMO Project Management System (Web + Mobile)

[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_Prisma-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![React Native](https://img.shields.io/badge/Mobile-React_Native_Expo-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Deployment](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)

A cross-platform **Project & Task Management System** featuring a web application, native mobile application (Android/iOS), and scalable REST API. Both web and mobile applications connect to the same cloud backend and PostgreSQL database, providing real-time bidirectional synchronization, hardware-backed token security, and Role-Based Access Control (RBAC).

---

## 🌐 Live Deployments & Downloads

| Platform | Deployment URL / Artifact | Status |
| :--- | :--- | :---: |
| **Web Frontend** | [https://ismo-project-management.vercel.app](https://ismo-project-management.vercel.app) | 🟢 Live on Vercel |
| **Backend REST API** | [https://ismo-backend.vercel.app/api](https://ismo-backend.vercel.app/api) | 🟢 Live on Vercel |
| **API Health Check** | [https://ismo-backend.vercel.app/api/health](https://ismo-backend.vercel.app/api/health) | 🟢 `{"status":"ok"}` |
| **Android Standalone APK** | [Download Mobile APK (`app-release.apk`)](#-mobile-app-apk--distribution) | 📱 Ready to Install |

---

## 🔑 Pre-Configured Test Accounts

All accounts are pre-seeded with the password: **`password123`**

| Role | Email | Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** (`ADMIN`) | `admin@ismo.dev` | `password123` | Full system visibility. Exclusive authority to assign user roles across the organization. Can create, edit, and delete any project or task. |
| **Project Leader** (`PROJECT_LEADER`) | `leader@ismo.dev` | `password123` | Can create new projects, manage projects created by or assigned to them, create and assign tasks, and post updates. |
| **Member** (`MEMBER`) | `intern@ismo.dev` | `password123` | Default role for all accounts. Strictly sees only projects and tasks assigned to them. Can toggle task completion statuses. |

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients["Client Applications"]
        Web["Web Client (React + Vite + Tailwind)\nhttps://ismo-project-management.vercel.app"]
        Mobile["Mobile App (React Native Expo)\nAndroid APK & Expo Go"]
    end

    subgraph CloudBackend["Cloud Backend (Vercel Serverless)"]
        API["Express.js REST API\nhttps://ismo-backend.vercel.app/api"]
        AuthMid["JWT Auth Middleware & Rate Limiting"]
        RBACMid["Role-Based Access Control (RBAC)"]
        Prisma["Prisma ORM Client (Parameterized Queries)"]
    end

    subgraph DatabaseCloud["Cloud Database (Supabase)"]
        DB[("PostgreSQL Database\nRoles, Users, Projects, Tasks, Activity Logs")]
    end

    Web -->|"HTTPS / JWT Bearer"| API
    Mobile -->|"HTTPS / Hardware Keystore JWT"| API
    API --> AuthMid
    AuthMid --> RBACMid
    RBACMid --> Prisma
    Prisma -->|"Transaction Pooler (:6543)"| DB
```

---

## 🗄️ Database Schema & Entity-Relationship (ER) Diagram

The system uses a normalized relational schema with foreign key relationships, cascade deletion rules, and indexing.

```mermaid
erDiagram
    ROLE ||--o{ USER : "assigns permissions"
    USER ||--o{ PROJECT : "creates (userId)"
    USER ||--o{ PROJECT : "assigned to (assignedToId)"
    USER ||--o{ TASK : "creates (creatorId)"
    USER ||--o{ TASK : "assigned to (assignedToId)"
    USER ||--o{ ACTIVITY_LOG : "authors (userId)"
    USER ||--o{ ACTIVITY_LOG : "targets (targetUserId)"
    PROJECT ||--o{ TASK : "contains"
    PROJECT ||--o{ ACTIVITY_LOG : "records"

    ROLE {
        string id PK
        string name UK "ADMIN, PROJECT_LEADER, MEMBER"
        string description
        datetime createdAt
    }

    USER {
        string id PK
        string name
        string email UK
        string password "bcrypt hash (10 rounds)"
        string roleId FK
        datetime createdAt
        datetime updatedAt
    }

    PROJECT {
        string id PK
        string name
        string description
        string status "Not Started, In Progress, Completed"
        string startDate "YYYY-MM-DD"
        string endDate "YYYY-MM-DD"
        string userId FK "Creator / Leader"
        string assignedToId FK "Assigned Member or Lead"
        datetime createdAt
        datetime updatedAt
    }

    TASK {
        string id PK
        string name
        string description
        string priority "Low, Medium, High"
        string status "Pending, In Progress, Completed"
        string dueDate "YYYY-MM-DD"
        string projectId FK
        string creatorId FK
        string assignedToId FK
        datetime createdAt
        datetime updatedAt
    }

    ACTIVITY_LOG {
        string id PK
        string action "CREATED, ASSIGNED, UPDATED_STATUS, ROLE_CHANGED"
        string message
        string entityType "PROJECT, TASK, USER"
        string entityId
        string entityName
        string userId FK "Actor"
        string targetUserId FK "Recipient"
        string projectId FK
        datetime createdAt
    }
```

---

## 📚 Complete API Reference

All requests and responses use JSON formatting. Protected routes require `Authorization: Bearer <token>`.

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Protected | Rate Limited | Description |
| :---: | :--- | :---: | :---: | :--- |
| `POST` | `/api/auth/register` | No | Yes (30/15min) | Register new user (`name`, `email`, `password`). Default role: `MEMBER`. |
| `POST` | `/api/auth/login` | No | Yes (30/15min) | Sign in with email and password. Returns JWT token and user profile. |
| `POST` | `/api/auth/logout` | No | No | Sign out user session. |
| `GET` | `/api/auth/me` | Yes | No | Get authenticated user profile with role permissions. |

### Project Management Endpoints (`/api/projects`)
| Method | Endpoint | Protected | Role Scope | Description |
| :---: | :--- | :---: | :---: | :--- |
| `GET` | `/api/projects` | Yes | All Roles | Get projects (supports `?search=` and `?status=`). Members only see assigned projects. |
| `GET` | `/api/projects/:id` | Yes | All Roles | Get project details, progress percentage, and all associated tasks. |
| `POST` | `/api/projects` | Yes | Leader / Admin | Create new project (`name`, `description`, `status`, `startDate`, `endDate`, `assignedToId`). |
| `PUT` | `/api/projects/:id` | Yes | Leader / Admin | Update project details (Project Leader must lead or be assigned the project). |
| `DELETE` | `/api/projects/:id` | Yes | Leader / Admin | Delete project and cascade-delete all associated tasks and logs. |

### Task Management Endpoints (`/api/tasks`)
| Method | Endpoint | Protected | Role Scope | Description |
| :---: | :--- | :---: | :---: | :--- |
| `GET` | `/api/tasks` | Yes | All Roles | Get tasks (supports `?projectId=`, `?status=`, `?priority=`, `?search=`). |
| `GET` | `/api/tasks/:id` | Yes | All Roles | Get single task details. |
| `POST` | `/api/tasks` | Yes | Leader / Admin | Create task in project (`projectId`, `name`, `description`, `priority`, `status`, `dueDate`, `assignedToId`). |
| `PUT` | `/api/tasks/:id` | Yes | All Roles | Members can toggle `status` (`Pending` ↔ `Completed`). Leaders/Admins can edit all fields. |
| `DELETE` | `/api/tasks/:id` | Yes | Leader / Admin | Delete task. |

### Dashboard & Analytics Endpoints (`/api/dashboard`)
| Method | Endpoint | Protected | Role Scope | Description |
| :---: | :--- | :---: | :---: | :--- |
| `GET` | `/api/dashboard` | Yes | All Roles | Returns 5 scoped metrics: `totalProjects`, `totalTasks`, `completedTasks`, `pendingTasks`, `projectsInProgress`. |

### Team & Role Management Endpoints (`/api/users`)
| Method | Endpoint | Protected | Role Scope | Description |
| :---: | :--- | :---: | :---: | :--- |
| `GET` | `/api/users` | Yes | All Roles | Get all team members for task assignment dropdowns. |
| `GET` | `/api/users/roles` | Yes | All Roles | Get all available roles (`ADMIN`, `PROJECT_LEADER`, `MEMBER`). |
| `PATCH` | `/api/users/:id/role` | Yes | **Admin Only** | Change user role (`roleName`: `'PROJECT_LEADER'` or `'MEMBER'`). |

### Activity Feed Endpoints (`/api/updates`)
| Method | Endpoint | Protected | Role Scope | Description |
| :---: | :--- | :---: | :---: | :--- |
| `GET` | `/api/updates` | Yes | All Roles | Get latest activity log stream scoped to user's assignments. |

---

## 🚀 Local Setup & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **PostgreSQL** instance (local, or free cloud on Neon / Supabase)

---

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example or create .env:
```

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-super-secure-jwt-secret-key-32-chars-long"
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

```bash
# Push schema to database
npm run prisma:push

# (Optional) Seed demo users, projects, and tasks
npm run seed

# Start development server (with hot reload via nodemon)
npm run dev
```
Backend runs on **`http://localhost:5000`** (Health check: `http://localhost:5000/api/health`).

---

### 2. Frontend (Web) Setup
```bash
cd ../frontend

# Install dependencies
npm install
```

Create `frontend/.env`:
```env
# Point to local backend (or leave blank to target deployed Vercel backend)
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK=false
```

```bash
# Start development server
npm run dev
```
Web app runs on **`http://localhost:5173`** (or `http://localhost:3000`).

---

### 3. Mobile App (React Native / Expo) Setup
```bash
cd ../mobile

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

- **Run on Android Emulator**: Press **`a`** in the terminal (ensure Android Studio / Emulator is open).
- **Run on Physical Phone**: Scan the terminal QR code with **Expo Go** (Android) or the **Camera app** (iOS).
- The mobile app is pre-configured out-of-the-box to target the live production Vercel backend (`https://ismo-backend.vercel.app/api`).

---

## 📱 Mobile App: APK & Distribution

### Standalone Android APK (`.apk`)
A standalone Android APK has been compiled via **EAS Build** and requires zero installation of Node.js or Expo Go on the testing device.

1. **Direct Download**: Built and hosted on Expo Application Services (EAS Build).
2. **Installation Steps**:
   - Download the `.apk` directly to your Android device.
   - Tap the file to install (allow *"Install unknown apps"* in Android Settings if prompted).
   - Launch **ISMO Projects** from your app drawer.
   - Log in with `admin@ismo.dev` / `password123`.

### Key Mobile Engineering Highlights:
- **Hardware Keystore Storage**: Auth tokens are encrypted using `expo-secure-store`, leveraging **Android Keystore** and **iOS Keychain**.
- **Real-Time Tab Synchronization**: Replaced polling with `useFocusEffect` on Dashboard, Projects, Tasks, and Project Details screens. Navigating between tabs automatically refreshes data in the background.
- **Responsive Metrics Cards**: `StatCard` dynamically flexes across all screen widths (360px–412px) without right-edge bezel clipping.
- **Admin 5th Tab**: Administrators dynamically receive a 5th bottom navigation tab (**Team & Roles**) with live role re-assignment.

---

## 🛡️ Security & Engineering Best Practices

- **Password Protection**: Salting and hashing via `bcryptjs` (cost factor 10). Plaintext passwords are never saved or returned in JSON responses.
- **SQL Injection Immunization**: 100% parameterization through Prisma ORM query builder.
- **Brute Force Protection**: IP rate-limiting (`express-rate-limit`) on `/api/auth/register` and `/api/auth/login` (30 requests per 15 minutes).
- **Graceful Error Handling**: Unified error handler returns clean JSON error messages without leaking stack traces or internal environment variables in production.
- **Input Validation**: Backend Zod schemas validate types, required fields, date formats, and enums before requests reach controllers.

---

## 🎬 5-Minute Video Recording Guide (Submission Deliverable #7)

To record your 5-minute video demonstration:

1. **Setup (0:00 - 0:30)**:
   - Place Web App (`https://ismo-project-management.vercel.app`) on the left half of your screen.
   - Place Mobile App (phone screen mirror or emulator) on the right half.
2. **Authentication (0:30 - 1:15)**:
   - Sign in as Project Leader (`leader@ismo.dev` / `password123`) on both platforms.
   - Note the matching credentials and role badges.
3. **Web-to-Mobile Real-Time Sync (1:15 - 2:30)**:
   - On Web: Click **"Create Task"** -> create *"Production Release Verification"*, assign to `Pranat (intern@ismo.dev)`.
   - On Mobile: Tap the **Tasks** tab (or pull-to-refresh) -> show the task appearing instantly!
4. **Mobile-to-Web Real-Time Sync (2:30 - 3:45)**:
   - On Mobile: Tap the checkbox to mark the task **Completed**.
   - On Web: Refresh the dashboard/tasks page -> show the task completed and progress bar updated!
5. **Role-Based Access Control (3:45 - 4:45)**:
   - Sign in as Admin (`admin@ismo.dev`) -> show the **Team & Roles** panel.
   - Change a user's role from Member to Project Leader.
   - Sign in as Member (`intern@ismo.dev`) -> show that "Create Project" and "Create Task" buttons are hidden and only assigned items are visible.
6. **Wrap-up (4:45 - 5:00)**:
   - Highlight hardware Keystore storage, cloud Vercel deployments, and conclusion.

---

## 👥 Contributors & Submission Details

- **Candidate**: Pranat
- **Role**: Full Stack Developer Assessment (Web + Mobile)
- **Repository**: [https://github.com/kpranat/ISMO-Project-Management](https://github.com/kpranat/ISMO-Project-Management)
- **Submission Date**: October 2026