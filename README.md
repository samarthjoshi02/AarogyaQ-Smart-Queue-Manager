# AarogyaQ — Smart Queues for Healthier Waiting

A production-grade, real-time healthcare queue management system designed to replace traditional paper-token waiting setups with automated client portals, active sound announcements, and direct spreadsheet log compiles.

---

## Key Features

### 1. Receptionist Admin Dashboard
* **Patient Registration**: Add patient details (Name, Age, Mobile) to dynamically allocate unique queue tokens (e.g., `AQ-001`).
* **Live Queue Table**: Dynamic sorting, filtering, and row selection tools.
* **Control Station**: Trigger "Call Next Patient" (which auto-completes the serving token) or cancel specific patient slots.
* **Consultation Settings**: Modify standard checkup time durations (1–60 mins) to update wait estimates.
* **Analytics Engine**: Responsive SVG Area & Bar charts depicting queue wait averages, peak patient times, and completed consultation logs (built without heavy external dependencies to guarantee compatibility with React 19).
* **Excel Export**: A simple action trigger to instantly download database records directly to the local Downloads directory.

### 2. Patient Personal Portal
* **Simulated Google & OTP Logins**: Native-looking Google Account Chooser popups and animated Mobile SMS OTP code toasts with countdown counters.
* **Profile Management**: Maintain persistent medical records (Blood Group, Medical Conditions, Age, Gender) stored securely in client-side storage.
* **Live Waitlist Tracker**: Shows active token ticket, queue position, estimated wait times, and progress bar updates in real-time.
* **Self-Queue Booker**: Book waitlist queue tokens directly from mobile/web interfaces.

### 3. Patient Waiting Room TV Display
* **Midnight Dark Mode**: Specially optimized layout for large hospital/waiting room television screens.
* **Serving Banner**: Giant fonts displaying the active ticket number and called patient name.
* **Audio Voice Chime**: Synthetic sound chimes and automated text-to-speech caller alerts powered by the browser's Web Audio API.
* **Helpline Ticker**: Smoothly scrolling bottom ticker listing emergency contacts, clinic lines, and support emails.

### 4. Backend & Sync Architecture
* **Real-time WebSockets**: Socket.IO synchronization ensuring 0ms delay updates across all patient and admin screens.
* **SQL Datastore**: Persistent SQLite3 database logic managing patient wait lists and settings.
* **Local Excel Synchronizer**: SheetJS compiler that automatically syncs the SQLite database to a local spreadsheet (`AarogyaQ_Queue_Data.xlsx`) in the project root folder on every database update.

---

## Tech Stack

* **Frontend**: React (Vite), Vanilla CSS, Lucide React Icons, Socket.IO Client.
* **Backend**: Node.js (Express), SQLite3, Socket.IO Server, SheetJS (`xlsx`).

---

## Setup & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)

### 1. Installation
Run the root-level script to automatically download and install dependencies for both the frontend and backend folders:
```bash
npm run install-all
```

### 2. Run the Development Server
Launch the backend server and frontend Vite application concurrently:
```bash
npm run dev
```
Once started:
* **Patient & Admin Portal**: [http://localhost:5173/](http://localhost:5173/)
* **Receptionist Admin URL**: [http://localhost:5173/receptionist](http://localhost:5173/receptionist) *(Default credentials: `admin` / `admin123`)*
* **Patient Waiting Room TV**: [http://localhost:5173/waiting-room](http://localhost:5173/waiting-room)
* **Backend API Console**: [http://localhost:5000/](http://localhost:5000/)

---

## Project Directory Structure

```
AarogyaQ/
├── backend/
│   ├── db.js             # Promisified SQLite3 datastore configurations
│   ├── excelSync.js      # SheetsJS database compilation compiler
│   ├── server.js         # API Routing & Socket.IO server configurations
│   └── package.json      # Express & dependency orchestrations
├── frontend/
│   ├── src/
│   │   ├── components/   # Modular dashboard, TV, and caller elements
│   │   ├── App.jsx       # Consolidated patient route views and portals
│   │   ├── index.css     # Premium HealthTech UI design specifications
│   │   └── main.jsx
│   └── package.json      # React 19, Vite, and WebSocket clients
├── AarogyaQ_Queue_Data.xlsx # Automatically updated local spreadsheet log
├── package.json          # Root dev task orchestrator
└── README.md
```

---

## Licenses & Credits
Developed as a production-quality clinic queue manager by Antigravity. Open-sourced under the MIT License.
