# 🚀 AI Agent Context Transfer: Smart Institutional Event Report Management System

You are taking over the development of the **Smart Institutional Event Report Management System**, a cross-platform monorepo application designed to automate event reporting, approval workflows, and professional PDF generation for educational institutions. 

This document provides a comprehensive, high-fidelity context transfer. It outlines the exact architecture, directories, current implementation progress, critical structural discrepancies between early plans and the codebase, and a detailed next-steps guide so you can pick up the work instantly.

---

## 📂 Project Structure & Current State

The workspace is a monorepo currently structured into two active directories: a TypeScript-Express backend and an Expo-React Native mobile app.

```
AndroidProject/
├── backend/                     # TypeScript + Express API Server
│   ├── src/
│   │   ├── config/              # Configuration (MongoDB, Cloudinary, SMTP, base config)
│   │   ├── controllers/         # Thin HTTP request handlers
│   │   ├── middleware/          # JWT Auth, Role checking, File upload, Error handlers
│   │   ├── models/              # Mongoose DB Schemas (User, Event, Report, etc.)
│   │   ├── routes/              # Express API Routes
│   │   ├── services/            # Main business logic (Auth, Event, Report, PDF, Notification)
│   │   ├── templates/           # Handlebars HTML/CSS templates for PDF compilation
│   │   ├── server.ts            # Entry point
│   │   └── app.ts               # App configurations and middleware stack
│   └── package.json
│
├── mobile/                      # Expo React Native App (TypeScript)
│   ├── app/                     # Expo Router (file-based navigation)
│   │   ├── (auth)/              # Authentication screens (Login)
│   │   └── (user)/              # Logged-in screens (Dashboard, Event details, Reports)
│   ├── src/
│   │   ├── components/ui/       # Base UI primitives (Button, Card, Input)
│   │   ├── services/            # Axios API clients
│   │   ├── stores/              # Zustand global states (Auth, Events, Reports)
│   │   └── theme/               # Colors, spacing, typography tokens
│   └── package.json
│
└── package.json                 # Monorepo Workspace root
```

---

## ⚡ Technical Stack Overview

### Backend (API Server)
*   **Runtime & Framework**: Node.js 20+ with Express.js written in TypeScript.
*   **Database & ORM**: MongoDB connected via **Mongoose** (dynamic, virtual relations).
*   **Authentication**: Stateless JWT-based authentication (15m Access Token / 7d Refresh Token stored securely).
*   **Image Management**: [Multer](https://github.com/expressjs/multer) on local node server proxied straight to **Cloudinary CDN** (secure server-side upload).
*   **PDF Compiler**: Server-side rendering using **Puppeteer** (headless Chromium browser) and **Handlebars** html templates.
*   **Notifications**: Push notification service using **Firebase Admin SDK (FCM)**.

### Mobile Client (Android/iOS)
*   **Framework & Navigation**: **Expo SDK 54** with **Expo Router v6** (file-based routing).
*   **Styling**: Native React Native styling based on modular design variables defined in [theme/index.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/mobile/src/theme/index.ts).
*   **State Management**: **Zustand** (lightweight hook-based store architecture).
*   **Storage**: **Expo Secure Store** for encrypted token storage.
*   **API Client**: Axios instance featuring automatic interceptors for JWT injection and transparent token refresh retries.

---

## ⚠️ CRITICAL ARCHITECTURAL DISCREPANCIES (Read Before Writing Code!)

Do not follow [implementation_plan1](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/implementation_plan1) blindly. The codebase has deviated in several major ways:

1.  **PostgreSQL/Prisma ➡️ MongoDB/Mongoose**:
    *   *The Plan:* Suggested using PostgreSQL with Prisma ORM.
    *   *The Reality:* The database is actually **MongoDB**, managed through **Mongoose**. All schemas utilize Mongoose types and virtual fields for populate operations (e.g., populating sub-events and report sections).
    *   *Location:* Database connection details are in [database.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/config/database.ts), schemas are in [models/](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/models/).
2.  **Missing `admin/` Package**:
    *   *The Plan:* A Vite + React administration panel listed under workspaces in root [package.json](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/package.json).
    *   *The Reality:* The `admin/` folder does **not exist** in the workspace yet. If needed, this must be scaffolded and built from scratch.
3.  **Missing `(admin)` Mobile Routes**:
    *   *The Plan:* The mobile client would host an `(admin)/` section in [app/](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/mobile/app/) for admin role operations.
    *   *The Reality:* Only `(auth)` and `(user)` groups are defined. The admin workflow resides wholly on the backend endpoints for now, or awaits front-end construction.

---

## 🔍 Core Workflows Already Implemented

### 1. Secure Token Refresh Flow
The authentication flow utilizes short-lived JWT access tokens and long-lived refresh tokens. The token lifecycle is transparently handled on the client side in [api.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/mobile/src/services/api.ts):
*   Axios request interceptor fetches `accessToken` from `SecureStore` and appends `Bearer <token>`.
*   On `401 Unauthorized` with `TOKEN_EXPIRED` payload, the response interceptor pauses the request pipeline, posts the `refreshToken` to `/auth/refresh`, stores the new tokens, updates headers, and retries the original request.

### 2. High-Performance PDF Generation & Upload
Unlike typical client-side PDF conversions, this system renders documents server-side for maximum visual consistency.
*   **Template Loading**: The system pulls Handlebars HTML from [default.hbs](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/templates/default.hbs) (or customized database templates in `Template` model).
*   **Compile Step**: Compiles with custom helpers (like currency formatting and image layout grids).
*   **Puppeteer Rendering**: Puppeteer opens a headless browser instance (using a singleton connection pattern inside [pdfService.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/services/pdfService.ts)), generates an A4 PDF buffer, and closes the tab.
*   **CDN Upload**: Uploads the PDF stream directly to Cloudinary and registers the URL into the `Report` document.

---

## 🛠️ Monorepo Database Models (Mongoose Schemas)

The database schema is highly optimized for reports:
*   [User.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/models/User.ts): Email/Password (bcrypt hashed), role distinction (`ADMIN` vs `USER`), department, and `fcmToken` (push notifications).
*   [Event.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/models/Event.ts): Basic details (name, type, venue, date, department) with a virtual `subEvents` relation linking back to parent events.
*   [Report.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/models/Report.ts): Relates to `Event`, registers front-page parameters (logos, institution title, subtitle), status (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`), and links to:
    *   `ReportSection`: Custom narrative chunks.
    *   `Budget`: Incurred cost line items.
*   [ReportSection.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/models/ReportSection.ts): Structural narrative section (objectives, conclusion, custom text block) with configurable visual settings (`imageLayout`, `imageFrame`) and populated `Image` entities.

---

## 🎯 NEXT DEV TASKS: What You Need to Build

The backend APIs are highly functional, but the mobile app's report-building views are heavily stubbed out. Here is your immediate implementation checklist:

### Task 1: Implement the Mobile Report Editors
In [reports/[id].tsx](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/mobile/app/%28user%29/reports/%5Bid%5D.tsx), the navigation targets for the builder cards are stubbed out with TODO comments:
*   [ ] **Front Page Editor Screen**: Create a screen to modify report front page branding details (institution name, department name, subtitles, and upload logos). Connect this to `updateFrontPage` in `useReportStore`.
*   [ ] **Section Manager Screen**: Build a view allowing users to create new report sections (type `ABOUT`, `OBJECTIVES`, `GALLERY`, etc.), re-order them, type paragraph/bullet text, and manage/upload images to these sections. Connect this to `addSection`, `updateSection`, `deleteSection`, and `reorderSections` in the Zustand store.
*   [ ] **Budget Summary Screen**: Build a ledger grid interface to add, edit, and delete budget line items (item name, quantity, unit cost). Connect this to the budget methods in `useReportStore`.

### Task 2: Build the Admin Workspace (`admin/`)
*   [ ] Initialize a React-Vite-Tailwind subproject inside the `/admin` root folder.
*   [ ] Set up an analytics dashboard using `Recharts` to consume `/api/analytics/overview` metrics.
*   [ ] Write management views for creating new Events, assigning Faculty/Users to events, and an Admin approval deck to preview and either Approve or Reject (with feedback note) submitted reports.

### Task 3: Firebase Cloud Messaging Integration
*   [ ] Create and drop in your `firebase-service-account.json` to configure [notificationService.ts](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/src/services/notificationService.ts).
*   [ ] Complete the client-side token registration flow to send real-time push alerts on Event Assignments, Rejections, and Approvals.

---

## 🚀 How to Run Locally

### 1. Setting up Backend
Create [backend/.env](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/.env) based on [.env.example](file:///c:/Users/KRISHNA%20KHIRBADODIYA/Desktop/Project/AndroidProject/backend/.env.example):
```env
MONGODB_URI=mongodb://localhost:27017/event_report_system
JWT_SECRET=devsecretjwt
JWT_REFRESH_SECRET=devrefreshjwt
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```
Run these commands from the `backend/` directory:
```bash
npm install
npm run seed   # Creates seed admin (admin@institution.edu / Admin@123) and staff users (rahul@institution.edu / User@123)
npm run dev    # Launches Express server on port 5000
```

### 2. Setting up Mobile Client
Ensure you have the Expo CLI installed. Inside `/mobile`:
Create `/mobile/.env` or configure the environment variable:
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```
Run the client:
```bash
npm install
npm run android   # Opens in your android emulator / Expo Go
```

---

## 📈 Current API Interface Map (Use these Axios calls)

| Service Store API Methods | Backend Route Handler | Action Details |
|---|---|---|
| `authApi.login` | `POST /api/auth/login` | Login & fetch security tokens |
| `eventApi.getAll` | `GET /api/events` | List all assigned events |
| `reportApi.create` | `POST /api/reports` | Create standard report draft for event |
| `reportApi.updateFrontPage`| `PATCH /api/reports/:id/front-page`| Update logos & subtitle configs |
| `reportApi.addSection` | `POST /api/reports/:id/sections` | Append section structure |
| `reportApi.reorderSections`| `PATCH /api/reports/:id/sections/reorder`| Adjust render hierarchy |
| `imageApi.upload` | `POST /api/images/sections/:id/images`| Upload multipart attachments |
| `reportApi.generatePdf` | `GET /api/reports/:id/pdf` | Start server-side Puppeteer layout & build |

**Best of luck! Leverage the preconfigured Zustand Stores and Axios instances; they are already fully typed and optimized for these exact flows!**
