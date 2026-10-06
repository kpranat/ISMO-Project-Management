# ISMO Project Management System - Frontend

A modern, fluid, responsive React web application built with **React (JavaScript / JSX)**, **Tailwind CSS**, **Vite**, and **Lucide Icons** as specified in the internship project assessment.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000` (or `http://localhost:5173`).

### Production Build
```bash
npm run build
npm run preview
```

---

## 🌟 Key Features Implemented

### 1. User Authentication
- **User Registration**: Full Name, Email, Password, and Password Confirmation validation.
- **User Login**: Email & Password validation with 1-click Instant Demo login for rapid evaluation.
- **Session Persistence**: JWT token and user profile stored securely with automatic logout on token expiration.
- **Route Protection**: Dedicated `ProtectedRoute` safeguarding internal pages.

### 2. Dashboard
- **5 Live Metric Cards**:
  - Total Projects
  - Projects In Progress
  - Total Tasks
  - Pending Tasks
  - Completed Tasks
- **Active Projects Overview**: Progress bars showing completed vs. total task ratio.
- **Upcoming Tasks**: Urgency-sorted list with instant one-click completion toggle.

### 3. Project Management
- **Full CRUD**: Create, Read/View, Update/Edit, and Delete projects.
- **Required Fields**: Project Name, Description, Status (`Not Started`, `In Progress`, `Completed`), Start Date, End Date.
- **Search & Filter**: Real-time project search by name and filtering by status tabs.
- **Cascading Deletion Safety**: Deleting a project cleanly removes associated tasks with a confirmation dialog.

### 4. Task Management
- **Full CRUD**: Create, Read/View, Update/Edit, and Delete tasks.
- **Project Association**: Assign tasks to projects with interactive dropdown selection.
- **Required Fields**: Task Name, Description, Priority (`Low`, `Medium`, `High`), Status (`Pending`, `In Progress`, `Completed`), Due Date.
- **Search & Filter**: Search tasks by name, filter by status, filter by priority, and filter by project.
- **1-Click Completion**: Checkbox toggle to mark tasks as completed instantly.

### 5. Dual Data Layer (Standalone Demo + REST API Ready)
- Built-in `mockStorage.js` seeded with realistic demo data stored in `localStorage`.
- Configured to automatically target your REST backend (`/api/auth/*`, `/api/projects/*`, `/api/tasks/*`, `/api/dashboard`) via Axios when `VITE_USE_MOCK=false`.
- Graceful network fallback ensures the app never crashes even if the backend server is temporarily unreachable.

---

## 🛠️ Environment Variables
Create a `.env` file in the `frontend` root to customize endpoints:

```env
# URL for the backend REST API
VITE_API_URL=http://localhost:5000/api

# Set to "false" when running against the live backend
VITE_USE_MOCK=true
```
