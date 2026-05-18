# Smart Institutional Event Report Management System

## Overview

A cross-platform mobile application for educational institutions to automate event report creation, management, formatting, approval, and PDF generation — replacing manual Word/Canva workflows.

> [!IMPORTANT]
> This plan covers **Phase 1** (no AI integration). The system will be built as a **monorepo** with three sub-projects: `backend/`, `mobile/`, and `admin/`.

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        M["📱 React Native Mobile App<br/>(Expo + Zustand + NativeWind)"]
        A["🖥️ Admin Dashboard<br/>(Vite + React + Tailwind)"]
    end
    subgraph "API Layer"
        GW["🔀 Express.js API Server<br/>(JWT Auth + Role Middleware)"]
    end
    subgraph "Service Layer"
        AS[Auth Service]
        ES[Event Service]
        RS[Report Service]
        PS[PDF Service<br/>Puppeteer + Handlebars]
        NS[Notification Service<br/>Firebase FCM]
        IS[Image Service<br/>Cloudinary]
    end
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>via Prisma ORM)]
        CL[☁️ Cloudinary CDN]
        FB[🔔 Firebase FCM]
    end
    M --> GW
    A --> GW
    GW --> AS & ES & RS & PS & NS & IS
    AS & ES & RS --> DB
    IS --> CL
    NS --> FB
    PS --> DB
```

---

## Tech Stack (Final Decisions)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Mobile** | Expo SDK 52+, TypeScript, Expo Router | File-based routing, type-safe navigation |
| **Styling (Mobile)** | NativeWind v4 | Tailwind-like classes in RN, CSS variables for theming |
| **State (Mobile)** | Zustand + persist middleware | Lightweight, selector-based re-renders, no providers |
| **Backend** | Node.js 20+, Express.js, TypeScript | Industry standard, strong ecosystem |
| **ORM** | Prisma 5+ | Auto-generated types, migrations, excellent DX |
| **Database** | PostgreSQL 16 | ACID compliance, JSON support, robust indexing |
| **PDF** | Puppeteer + Handlebars templates | Full CSS control, professional output |
| **Images** | Multer → Cloudinary (server-side proxy) | Secure API keys, server-side validation/resize |
| **Admin** | Vite + React + Tailwind CSS + Recharts | Fast dev server, utility-first CSS, composable charts |
| **Auth** | JWT (access + refresh tokens) + bcrypt | Stateless auth, secure password hashing |
| **Notifications** | Firebase Cloud Messaging | Cross-platform push notifications |

---

## Project Structure

### Monorepo Root
```
AndroidProject/
├── backend/
├── mobile/
├── admin/
├── shared/                # Shared TypeScript types & constants
│   ├── types/
│   └── constants/
├── package.json           # Workspace root (npm workspaces)
└── README.md
```

### Backend Structure
```
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── config/            # env, db, cloudinary, firebase config
│   ├── controllers/       # HTTP request handlers (thin)
│   ├── services/          # Business logic layer
│   ├── routes/            # Express route definitions
│   ├── middleware/         # auth, role, error, upload middleware
│   ├── templates/         # Handlebars HTML/CSS for PDF
│   │   ├── cultural.hbs
│   │   ├── seminar.hbs
│   │   ├── technical.hbs
│   │   └── industrial-visit.hbs
│   ├── utils/             # helpers, validators, logger
│   ├── types/             # TypeScript type definitions
│   ├── app.ts             # Express app setup
│   └── server.ts          # Entry point
├── uploads/               # Temporary local uploads (before Cloudinary)
├── .env
├── tsconfig.json
└── package.json
```

### Mobile App Structure
```
mobile/
├── app/                   # Expo Router file-based routes
│   ├── (auth)/            # Auth group
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── _layout.tsx
│   ├── (user)/            # User role screens
│   │   ├── dashboard.tsx
│   │   ├── events/
│   │   ├── reports/
│   │   │   ├── builder.tsx
│   │   │   ├── section-editor.tsx
│   │   │   ├── image-uploader.tsx
│   │   │   ├── budget-editor.tsx
│   │   │   └── preview.tsx
│   │   └── notifications.tsx
│   ├── (admin)/           # Admin role screens
│   │   ├── dashboard.tsx
│   │   ├── users/
│   │   ├── events/
│   │   ├── reports/
│   │   └── analytics.tsx
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Splash/redirect
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/            # Buttons, Cards, Inputs, Modals
│   │   ├── report/        # Section cards, image grid, etc.
│   │   └── layout/        # Headers, TabBars, Skeletons
│   ├── stores/            # Zustand stores (sliced by domain)
│   │   ├── authStore.ts
│   │   ├── eventStore.ts
│   │   ├── reportStore.ts
│   │   ├── uploadStore.ts
│   │   └── themeStore.ts
│   ├── services/          # API service layer (Axios)
│   │   ├── api.ts         # Axios instance + interceptors
│   │   ├── authService.ts
│   │   ├── eventService.ts
│   │   ├── reportService.ts
│   │   └── imageService.ts
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Helpers, formatters
│   ├── theme/             # NativeWind theme config, CSS vars
│   ├── types/             # TypeScript types
│   └── assets/            # Images, fonts, icons
├── app.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Admin Dashboard Structure
```
admin/
├── src/
│   ├── components/
│   │   ├── ui/            # Buttons, Cards, Tables, Modals
│   │   ├── charts/        # Recharts wrappers
│   │   ├── layout/        # Sidebar, Navbar, PageWrapper
│   │   └── reports/       # Report preview components
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Events.tsx
│   │   ├── Reports.tsx
│   │   └── Analytics.tsx
│   ├── services/          # API calls
│   ├── stores/            # Zustand stores
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── index.html
├── tsconfig.json
└── package.json
```

---

## Database Schema (Prisma)

```prisma
// Key models (simplified for plan — full schema in implementation)

model User {
  id            String       @id @default(uuid())
  name          String
  email         String       @unique
  phone         String?
  password      String       // bcrypt hashed
  department    String
  college       String?
  role          Role         @default(USER)
  assignments   Assignment[]
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  @@index([email])
  @@index([department])
}

model Event {
  id                String       @id @default(uuid())
  name              String
  type              EventType
  department        String
  date              DateTime
  venue             String
  convener          String
  coConvener        String?
  facultyCoordinator String?
  studentCoordinator String?
  volunteers        String[]
  socialMediaLinks  Json?
  themeType         ThemeType    @default(CORPORATE)
  parentEventId     String?
  parentEvent       Event?       @relation("SubEvents", fields: [parentEventId], references: [id])
  subEvents         Event[]      @relation("SubEvents")
  assignments       Assignment[]
  reports           Report[]
  status            EventStatus  @default(DRAFT)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  @@index([department])
  @@index([status])
}

model Assignment {
  id        String   @id @default(uuid())
  userId    String
  eventId   String
  user      User     @relation(fields: [userId], references: [id])
  event     Event    @relation(fields: [eventId], references: [id])
  assignedAt DateTime @default(now())
  @@unique([userId, eventId])
}

model Report {
  id            String          @id @default(uuid())
  eventId       String
  event         Event           @relation(fields: [eventId], references: [id])
  createdById   String
  status        ReportStatus    @default(DRAFT)
  templateId    String?
  template      Template?       @relation(fields: [templateId], references: [id])
  sections      ReportSection[]
  budgets       Budget[]
  frontPage     Json?           // logos, banner, branding data
  pdfUrl        String?
  submittedAt   DateTime?
  approvedAt    DateTime?
  rejectedAt    DateTime?
  rejectionNote String?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  @@index([eventId])
  @@index([status])
}

model ReportSection {
  id          String      @id @default(uuid())
  reportId    String
  report      Report      @relation(fields: [reportId], references: [id], onDelete: Cascade)
  type        SectionType
  heading     String
  content     Json?       // { paragraphs: [], bullets: [], richText: "" }
  sortOrder   Int
  images      Image[]
  imageLayout ImageLayout @default(AUTO)
  imageFrame  ImageFrame  @default(ROUNDED_RECTANGLE)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  @@index([reportId])
}

model Image {
  id        String        @id @default(uuid())
  sectionId String
  section   ReportSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  url       String        // Cloudinary URL
  publicId  String        // Cloudinary public_id
  caption   String?
  sortOrder Int
  width     Int?
  height    Int?
  createdAt DateTime      @default(now())
}

model Budget {
  id          String   @id @default(uuid())
  reportId    String
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  item        String
  quantity    Int      @default(1)
  unitCost    Float
  totalCost   Float
  category    String?
  createdAt   DateTime @default(now())
}

model Template {
  id          String   @id @default(uuid())
  name        String
  type        ThemeType
  htmlContent String   @db.Text
  cssContent  String   @db.Text
  thumbnail   String?
  isActive    Boolean  @default(true)
  reports     Report[]
  createdAt   DateTime @default(now())
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  title     String
  body      String
  type      NotificationType
  data      Json?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  @@index([userId, isRead])
}

// Enums
enum Role { ADMIN, USER }
enum EventType { CULTURAL, TECHNICAL, SEMINAR, WORKSHOP, INDUSTRIAL_VISIT, OTHER }
enum EventStatus { DRAFT, ACTIVE, COMPLETED, CANCELLED }
enum ReportStatus { DRAFT, SUBMITTED, APPROVED, REJECTED }
enum ThemeType { CULTURAL, TECHNICAL, SEMINAR, ENVIRONMENT, CORPORATE }
enum SectionType { ABOUT, OBJECTIVES, HIGHLIGHTS, WINNERS, CONCLUSION, GALLERY, BUDGET, CUSTOM }
enum ImageLayout { FULL_WIDTH, SIDE_BY_SIDE, GRID, AUTO }
enum ImageFrame { CIRCLE, OVAL, ROUNDED_RECTANGLE, NONE }
enum NotificationType { ASSIGNMENT, SUBMISSION, APPROVAL, REJECTION, REMINDER }
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Get current user profile |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users` | List all users (paginated) |
| GET | `/api/users/:id` | Get user details |
| PATCH | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Soft delete user |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events` | Create event (Admin) |
| GET | `/api/events` | List events (filtered by role) |
| GET | `/api/events/:id` | Get event with sub-events |
| PATCH | `/api/events/:id` | Update event |
| POST | `/api/events/:id/assign` | Assign users to event |
| GET | `/api/events/:id/assignments` | Get event assignments |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Create report for event |
| GET | `/api/reports` | List reports (role-filtered) |
| GET | `/api/reports/:id` | Get full report with sections |
| PATCH | `/api/reports/:id` | Update report / auto-save draft |
| POST | `/api/reports/:id/submit` | Submit for approval |
| POST | `/api/reports/:id/approve` | Approve report (Admin) |
| POST | `/api/reports/:id/reject` | Reject with notes (Admin) |
| GET | `/api/reports/:id/pdf` | Generate & download PDF |
| PATCH | `/api/reports/:id/front-page` | Update front page data |

### Report Sections
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:reportId/sections` | Add section |
| PATCH | `/api/sections/:id` | Update section content |
| DELETE | `/api/sections/:id` | Delete section |
| PATCH | `/api/reports/:reportId/sections/reorder` | Reorder sections |

### Images
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sections/:sectionId/images` | Upload images (multipart) |
| DELETE | `/api/images/:id` | Delete image |
| PATCH | `/api/sections/:sectionId/images/reorder` | Reorder images |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports/:reportId/budgets` | Add budget entry |
| PATCH | `/api/budgets/:id` | Update budget entry |
| DELETE | `/api/budgets/:id` | Delete budget entry |

### Admin Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/overview` | Dashboard stats |
| GET | `/api/analytics/events` | Event analytics |
| GET | `/api/analytics/reports` | Report analytics |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PATCH | `/api/notifications/:id/read` | Mark as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

---

## PDF Generation Workflow

```mermaid
sequenceDiagram
    participant U as User/Admin
    participant API as Express API
    participant PS as PDF Service
    participant DB as PostgreSQL
    participant P as Puppeteer
    participant CL as Cloudinary

    U->>API: GET /reports/:id/pdf
    API->>DB: Fetch report + sections + images + budgets
    DB-->>API: Full report data
    API->>PS: generatePDF(reportData)
    PS->>PS: Select template (cultural/seminar/etc.)
    PS->>PS: Compile Handlebars template with data
    PS->>PS: Apply theme CSS + image layout logic
    PS->>P: page.setContent(compiledHTML)
    P->>P: Render with print CSS
    P-->>PS: PDF Buffer
    PS->>CL: Upload PDF to Cloudinary
    CL-->>PS: PDF URL
    PS->>DB: Save pdfUrl to report
    PS-->>API: PDF URL
    API-->>U: PDF download/URL
```

**Image Layout Logic (in templates):**
- 1 image → `width: 100%`
- 2 images → `display: flex; width: 50%` each
- 3 images → first full-width, next two side-by-side
- 4+ images → CSS Grid `grid-template-columns: repeat(auto-fit, minmax(45%, 1fr))`

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant App as Mobile App
    participant API as Backend
    participant DB as Database

    App->>API: POST /auth/login {email, password}
    API->>DB: Find user by email
    DB-->>API: User record
    API->>API: bcrypt.compare(password, hash)
    API->>API: Generate JWT access (15min) + refresh (7d)
    API-->>App: { accessToken, refreshToken, user }
    App->>App: Store tokens (SecureStore) + user (Zustand persist)
    
    Note over App,API: On 401 response...
    App->>API: POST /auth/refresh { refreshToken }
    API->>API: Verify refresh token
    API-->>App: { newAccessToken }
    App->>App: Update stored access token
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize monorepo with npm workspaces
- [ ] Backend: Express + TypeScript + Prisma setup
- [ ] Database: Schema design + initial migration + seed data
- [ ] Auth: JWT login/register + middleware + refresh tokens
- [ ] Mobile: Expo project + NativeWind + Zustand + Expo Router
- [ ] Mobile: Auth screens (Splash, Login, Forgot Password)
- [ ] Admin: Vite + React + Tailwind scaffold

### Phase 2: Core Features (Week 3-4)
- [ ] Backend: Event CRUD + assignment endpoints
- [ ] Backend: Report CRUD + section management endpoints
- [ ] Backend: Image upload (Multer → Cloudinary pipeline)
- [ ] Mobile: User Dashboard + Assigned Events screens
- [ ] Mobile: Report Builder + Section Editor screens
- [ ] Mobile: Image Uploader with crop/preview/reorder
- [ ] Admin: Dashboard with stats cards + Recharts

### Phase 3: Report Engine (Week 5-6)
- [ ] Backend: Puppeteer PDF service (singleton browser)
- [ ] Backend: Handlebars templates (4 theme types)
- [ ] Backend: Image layout engine (auto grid logic)
- [ ] Backend: Front page generation with logos/branding
- [ ] Mobile: Report Preview screen (WebView)
- [ ] Mobile: Budget Editor screen
- [ ] Mobile: Front Page configurator

### Phase 4: Workflow & Admin (Week 7-8)
- [ ] Backend: Approval workflow (submit/approve/reject)
- [ ] Backend: Notification service + Firebase FCM
- [ ] Mobile: Notifications screen
- [ ] Mobile: Draft auto-save (debounced PATCH)
- [ ] Admin: User Management (CRUD)
- [ ] Admin: Event Management + Assignment
- [ ] Admin: Report monitoring + preview + approval

### Phase 5: Polish (Week 9)
- [ ] Theme system (5 theme variants with CSS variables)
- [ ] Loading states + skeleton screens
- [ ] Error handling + retry logic
- [ ] Responsive design audit
- [ ] Performance optimization (image lazy loading, pagination)

### Phase 6: Testing & Deployment (Week 10)
- [ ] API integration tests
- [ ] Mobile E2E testing
- [ ] Docker setup for backend
- [ ] Deployment configuration (Railway/Render + Vercel)
- [ ] Documentation

---

## User Review Required

> [!IMPORTANT]
> **Database Choice**: The plan uses PostgreSQL with Prisma. Do you have a PostgreSQL instance ready (local or cloud like Supabase/Neon)? This affects setup instructions.

> [!IMPORTANT]
> **Cloudinary & Firebase**: You'll need active accounts for Cloudinary (image CDN) and Firebase (push notifications). Do you have these set up, or should I include setup instructions?

> [!IMPORTANT]
> **Expo Router vs React Navigation**: The plan uses Expo Router (file-based routing) instead of React Navigation as it's the modern standard. Your original spec mentioned React Navigation — are you okay with Expo Router instead?

## Open Questions

1. **Deployment target**: Where do you plan to deploy the backend? (Railway, Render, AWS, DigitalOcean, local server?)
2. **Email service**: For forgot-password, which email provider? (Nodemailer + Gmail, SendGrid, Resend?)
3. **Scope priority**: Given the project size, should I start building **backend + mobile first** and add the admin dashboard later? Or all three simultaneously?
4. **Existing assets**: Do you have institution logos, color hex codes, or branding guidelines to incorporate?

---

## Verification Plan

### Automated Tests
- Backend API tests using Jest + Supertest
- Prisma schema validation via `prisma validate`
- TypeScript compilation checks across all packages

### Manual Verification
- Mobile app tested on Expo Go (iOS/Android)
- PDF output quality review (multiple templates)
- Admin dashboard browser testing
- End-to-end workflow: Create Event → Assign → Build Report → Submit → Approve → Generate PDF
