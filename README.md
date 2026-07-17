# Task Tracker

<p align="left">
  <img src="https://img.shields.io/badge/Vite-5.1+-blue?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/React-18.2+-blue?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Electron-29.0+-blue?style=flat-square&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Firebase-10.8+-orange?style=flat-square&logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

Task Tracker is a flagship, high-fidelity daily planner engineered with an offline-first architecture, seamless Cloud Firestore synchronization, and responsive data analytics. The application operates as a native standalone desktop workspace, complemented by a mobile platform scaffold designed for future ecosystem integration.

---

## 🚀 Key Architectural Pillars

### 1. Offline-First Data Strategy
The application prioritizes local execution speed and data safety. It reads and writes directly to browser-native `LocalStorage`, ensuring zero-latency operations even in completely offline environments. Database changes are cached locally and queued for immediate synchronization once an active network socket is detected.

### 2. Multi-Platform Support
* **Windows Hello Support**: Provides credentials checking hooks utilizing native Windows Hello biometric prompts (`UserConsentVerifier`) to lock/unlock settings pages, **if supported** by the host hardware and OS profile.
* **macOS Authentication**: Integrates native macOS Touch ID APIs via Electron's context bridge, validating settings updates securely **if supported**.
* **Linux Security**: Leverages system-level PAM authorization prompts (`pkexec`) to guard administrative views **if supported**.
* **System Isolation**: Local caching directories are explicitly isolated to the user's standard application directories:
  * **Windows**: `%APPDATA%\TaskTracker`
  * **macOS**: `~/Library/Application Support/TaskTracker`
  * **Linux**: `~/.config/TaskTracker`

### 3. Real-Time Cloud Syncing (Firebase / Firestore)
* **On-Demand Client Connections**: To protect user privacy and prevent resource leaks, the application does not load or embed server configuration details inside the compiled code.
* **Encrypted Settings Panel**: Firebase API keys, Project IDs, and document collections are inputted dynamically by the user inside the settings UI.
* **Instant Handshake**: The application dynamically initializes the Firebase SDK client-side, linking local databases to your private Cloud Firestore collection instantly without server-side exposure.

---

## ✨ Features & Functionality

### 📊 3D Productivity Room Grid
Renders dynamic task trends using WebGL-accelerated 3D column models. Tasks are projected onto a grid where height, status colors, and categories (Work, Personal, Health, Finance, Urgent, General, Study) are mapped to coordinate needles.
* **Render Optimizations**: The chart engine utilizes layout memoization, avoiding GPU re-allocations during parent render cycles to maintain steady 60fps performance.

### 🔥 Consecutive Daily Completion Streaks
Calculates task completion consistency on the fly. The algorithm groups completed timestamps into localized calendar dates, filtering out duplicates, and back-tracks daily records to determine the current active streak count. This data is displayed as a premium live visual indicator inside the profile dashboard.

### 🕒 3:00 AM Daily Rollover & Customization
* **Why 3:00 AM?**: The default rollover is set to 3:00 AM local time instead of midnight. This specific hour was chosen because it represents a natural boundary for the daily sleep cycle. Many users are still active and completing late-night tasks past midnight; 3:00 AM ensures that late-night progress is captured under the current day's analytics rather than being prematurely reset.
* **Customization**: If you prefer a different rollover hour, it can be easily tweaked inside your database configuration file:
  * Open [db.js](file:///c:/Users/kaklo/OneDrive/Desktop/Task%20Tracker/src/lib/db.js#L14)
  * Locate `ROLLOVER_HOUR` (default is `3`) and change it to your preferred hour (e.g., `0` for midnight).

### 🛡️ Desktop Stability & Packaging
* **Single-Instance Locking**: Monitors application launch states via native Electron locks. If a duplicate process is initiated, it automatically focuses the existing window and exits cleanly, preventing database locking collisions.
* **Payload Reduction**: The packaging pipeline filters out node development assets and native compilation packages, reducing the final standalone archive size from 143MB to **9.6MB** for instantaneous launch times.

---

## 💻 Developer Setup & Installation

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 2. Desktop Application

```bash
# Install root dependencies
npm install

# Run the app in development mode
npm run electron:dev

# Build production Vite assets
npm run build

# Package standalone executable
npm run package
```

### 3. Mobile Application Scaffold
```bash
# Navigate to the mobile folder
cd mobile

# Install dependencies
npm install

# Launch Expo developer tools
npm run start
```

---

## 🌐 Firebase & Cloud Firestore Setup

To enable real-time database backups and cloud sync:

1. **Create a Firebase Project**:
   * Open the [Firebase Console](https://console.firebase.google.com/).
   * Click **Add Project** and initialize a new database project.

2. **Enable Cloud Firestore**:
   * Navigate to **Build > Firestore Database**.
   * Click **Create Database** and configure the server location.

3. **Obtain Client Configuration**:
   * Register a new **Web App** `</>` under your Firebase Project Settings.
   * Copy the `firebaseConfig` credentials object:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "your-project-id.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project-id.appspot.com",
       messagingSenderId: "1234567890",
       appId: "1:12345:web:abcd1234"
     };
     ```

4. **Paste Configuration**:
   * Open the **Task Tracker** app.
   * Go to **Profile & Settings > Database Sync**.
   * Paste the copied configuration JSON object and click **Save Settings** to sync data.
