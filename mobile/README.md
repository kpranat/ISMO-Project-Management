# ISMO Project Management — Mobile Application (React Native / Expo)

A cross-platform mobile companion for **ISMO Project Management**, built with **React Native (Expo)** in pure JavaScript. It connects to the same backend API and Supabase PostgreSQL database as the web application, ensuring real-time bidirectional synchronization.

---

## 📱 Features

- **Hardware-Backed Keystore Storage**:
  - JWT auth tokens and user session data are stored securely using `expo-secure-store`, leveraging **Android Keystore** and **iOS Keychain**.
- **Role-Based Access Control**:
  - Full support for `ADMIN`, `PROJECT_LEADER`, and `MEMBER` roles matching backend permissions.
  - Leaders and Admins can create and edit projects and assign tasks to specific members.
  - Members see projects and tasks specifically assigned to them.
- **Dynamic Server Configuration**:
  - In-app **Server Configuration Modal** allows real-time switching between local Wi-Fi IP (`http://10.3.115.194:5000/api`), USB tethering, or deployed cloud URLs without rebuilding the app.
  - Built-in ping/connection test button with instant health-check feedback.
- **Pull-to-Refresh & Graceful Error Handling**:
  - Native `RefreshControl` on Dashboard, Projects, Tasks, and Project Details screens.
  - Informative offline and network error banners with single-tap "Retry" buttons.
  - 10-second request timeout with graceful fallback.
- **One-Tap Task Management**:
  - Toggle task completion status (`Pending` ↔ `Completed`) directly from Dashboard, Tasks list, or Project view.
- **Real-Time Project Progress**:
  - Visual progress bars dynamically calculate completed task percentages.

---

## 🛠️ Project Structure

```
mobile/
├── assets/                       # App icons and splash screen graphics
├── src/
│   ├── components/
│   │   ├── Badges.js             # StatusBadge, PriorityBadge, RoleBadge, AssigneeAvatar
│   │   ├── ServerModal.js        # Dynamic server URL switcher & ping tester
│   │   └── StatCard.js           # Metric summary cards with vector icons
│   ├── context/
│   │   └── AuthContext.js        # React Context managing session, roles & active server
│   ├── navigation/
│   │   └── AppNavigator.js       # AuthStack, BottomTabNavigator & RootStack modals
│   ├── screens/
│   │   ├── LoginScreen.js        # Login form with server switcher & quick error handling
│   │   ├── RegisterScreen.js     # User registration (default MEMBER role)
│   │   ├── DashboardScreen.js    # 5 Metric cards, assigned updates feed & upcoming tasks
│   │   ├── ProjectsScreen.js     # Project list, search, filter chips & progress bars
│   │   ├── ProjectDetailsScreen.js # Detailed project overview, timeline & tasks checklist
│   │   ├── ProjectFormScreen.js  # Create / Edit project modal with assignee selector
│   │   ├── TasksScreen.js        # Filterable tasks list with one-tap toggle & status badges
│   │   ├── TaskFormScreen.js     # Create / Edit task modal with project & user selector
│   │   └── ProfileScreen.js      # User profile, role permissions, keystore info & sign out
│   └── services/
│       ├── api.js                # Axios client (10s timeout, interceptors, error extractor)
│       ├── authStorage.js        # expo-secure-store wrapper for Android Keystore / iOS Keychain
│       └── config.js             # Server endpoint manager (default Wi-Fi IP + persistent override)
├── App.js                        # Root entry point (SafeAreaProvider + AuthProvider)
├── app.json                      # Expo configuration
└── package.json
```

---

## 🚀 How to Run on a Physical Mobile Device

### Step 1: Install Expo Go
On your physical phone:
- **Android**: Install [Expo Go from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
- **iOS**: Install [Expo Go from Apple App Store](https://apps.apple.com/app/expo-go/id982107779).

### Step 2: Ensure Both Devices are on the Same Wi-Fi Network
- Connect your **phone** and your **PC** to the same Wi-Fi network.
- Note your PC's IP address (e.g., `10.3.115.194`).

### Step 3: Start the Backend Server
In the backend directory:
```bash
cd D:\projects\ISMO\ISMO-Project-Management\backend
npm start
```
The backend will run on port `5000` and accept connections from your phone.

### Step 4: Start the Expo Development Server
In the mobile directory:
```bash
cd D:\projects\ISMO\ISMO-Project-Management\mobile
npx expo start
```
A large QR code will appear in the terminal.

### Step 5: Open the App on Your Phone
- **Android**: Open the **Expo Go** app and tap **"Scan QR code"**, then scan the QR code in your terminal.
- **iOS**: Open the native **Camera app** and point it at the QR code, then tap the link to open in Expo Go.

The JavaScript bundle will stream directly to your phone and the app will open!

---

## 🌐 Connecting to a Deployed Backend
When you deploy your backend to the cloud (e.g. Render, Railway, AWS):
1. In the mobile app, tap the **Server Settings** icon (top right of the Login screen or in the Profile tab).
2. Enter your deployed URL (e.g., `https://your-api.onrender.com/api`).
3. Tap **Test Connection** to verify reachability.
4. Tap **Save Endpoint**. The mobile app will instantly synchronize with your cloud database!

---

## 🔑 Test Accounts (Default Seed)

| Email | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin@ismo.dev` | `password123` | **ADMIN** | Full administrative control, all projects & tasks |
| `leader@ismo.dev` | `password123` | **PROJECT_LEADER** | Project creator, assign tasks to members |
| `intern@ismo.dev` | `password123` | **MEMBER** | View assigned projects/tasks, toggle status |

