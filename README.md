# CareConnect
### "Volunteer-to-Community Assistance Matching System"

CareConnect is a full-stack, community assistance platform that connects elderly individuals, persons with disabilities, and their registered caregivers with verified, local volunteers for everyday tasks—including grocery pickup, hospital accompaniment, prescription medicine pickup, transport assistance, and short home visits.

---

## 🌟 Core Features & Highlights

1. **Role-Based Access Control (RBAC)**
   - **Requester Portal**: Create multi-step assistance requests, choose task categories, select location interactively via OpenStreetMap, monitor live matching, view assigned volunteer, and verify completion with secure codes.
   - **Volunteer Portal**: Access KYC status verification badges, view matched community requests within proximity, accept/decline tasks, view contact details, mark tasks completed, and configure assistance capabilities.
   - **Coordinator / Admin Command Center**: Review pending assistance requests, inspect uploaded volunteer KYC documents in a secure authenticated viewer, approve or reject volunteers with mandatory feedback, manage volunteer suspensions, monitor dynamic radius matching, and review audit logs.

2. **Strict Volunteer KYC Verification**
   - Volunteers submit government identity documents (Aadhaar, Driving License, Passport, Voter ID).
   - **Sensitive Document Protection**: KYC files are stored in a private directory outside static web folders and are accessible strictly to authenticated coordinators via `/api/kyc/document/:id`.
   - **Match Eligibility Guard**: Volunteers with `PENDING_KYC` or `REJECTED` status are strictly prohibited from receiving or accepting community requests.

3. **Dynamic Search Radius Matching**
   - Matching follows a deterministic, rule-based approach:
     - Verified KYC status (`APPROVED`)
     - Capability compatibility
     - Day & schedule availability
     - Distance calculation using the **Haversine formula**
   - **Dynamic Expansion**: Search begins at **2 km**. If unanswered or no volunteers accept, the radius automatically or manually expands to **5 km**, **10 km**, and **15 km** maximum.

4. **Task Confirmation Code Verification System**
   - Each assistance request generates a unique confirmation code (e.g., `CARE-4821`).
   - When a volunteer completes the mission, the task enters `COMPLETION_PENDING`.
   - The requester verifies task completion by presenting or confirming the code, formally completing the task and recording volunteer service history.

5. **Dual-Mode Resilient Database Layer**
   - Seamlessly connects to **MongoDB** (local or Atlas) via Mongoose with 2dsphere indexes.
   - Includes a built-in local persistence fallback adapter so developers and evaluators can run the entire platform instantly out-of-the-box without manual database provisioning!

---

## 🏗️ Project Architecture & Directory Structure

```
careconnect/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx               # Login with 1-click persona switch
│   │   └── register/page.tsx            # Requester & Volunteer registration
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts           # JWT login & secure cookie
│   │   │   ├── register/route.ts        # Account creation & profile init
│   │   │   ├── logout/route.ts          # Session termination
│   │   │   └── me/route.ts              # Session & profile status
│   │   ├── coordinator/
│   │   │   ├── dashboard/route.ts       # Metrics & pending queues
│   │   │   ├── requests/route.ts        # All requests query
│   │   │   ├── volunteers/route.ts      # Volunteer roster query
│   │   │   └── history/route.ts         # Assignment history & audits
│   │   ├── kyc/
│   │   │   ├── submit/route.ts          # Document upload (multipart)
│   │   │   ├── pending/route.ts         # Pending coordinator queue
│   │   │   ├── [id]/route.ts            # Volunteer KYC details
│   │   │   ├── [id]/approve/route.ts    # Coordinator approval
│   │   │   ├── [id]/reject/route.ts     # Coordinator rejection with reason
│   │   │   ├── [id]/suspend/route.ts   # Account suspension
│   │   │   └── document/[id]/route.ts   # Secure authenticated document stream
│   │   ├── matching/
│   │   │   ├── start/route.ts           # Rule-based matching engine
│   │   │   ├── expand/route.ts          # Dynamic radius expansion
│   │   │   ├── accept/route.ts          # Volunteer task acceptance
│   │   │   └── decline/route.ts         # Volunteer task decline & re-dispatch
│   │   ├── notifications/
│   │   │   ├── route.ts                 # Notification list & unread count
│   │   │   └── [id]/route.ts            # Mark notification as read
│   │   ├── requests/
│   │   │   ├── route.ts                 # Create request & list
│   │   │   ├── [id]/route.ts            # Single request details & patch
│   │   │   └── [id]/cancel/route.ts     # Request cancellation
│   │   ├── tasks/
│   │   │   ├── [id]/complete/route.ts   # Volunteer marks task completed
│   │   │   └── [id]/confirm/route.ts    # Requester code confirmation
│   │   ├── volunteers/
│   │   │   ├── route.ts                 # Volunteers list
│   │   │   ├── [id]/route.ts            # Single volunteer profile
│   │   │   ├── profile/route.ts         # Update capabilities & area
│   │   │   └── availability/route.ts    # Update schedule days & slots
│   │   └── seed/route.ts                # 1-click database demo seeding API
│   ├── coordinator/page.tsx             # Coordinator Admin Command Center
│   ├── dashboard/page.tsx               # Role-based dashboard router
│   ├── requester/page.tsx               # Requester Portal & active tasks
│   ├── requests/
│   │   ├── create/page.tsx              # 4-Step assistance request wizard
│   │   └── [id]/page.tsx                # Single request tracking & code entry
│   ├── volunteer/page.tsx               # Volunteer Portal & request inbox
│   ├── globals.css                      # Tailwind & Leaflet styling
│   ├── layout.tsx                       # Root layout & AuthProvider
│   └── page.tsx                         # Landing page & demo launcher
├── components/
│   ├── common/
│   │   ├── KycBadge.tsx                 # Verified / Pending / Rejected badge
│   │   ├── Navbar.tsx                   # Navbar with Quick Role Switcher
│   │   ├── NotificationBell.tsx         # In-app real-time notification bell
│   │   └── StatusBadge.tsx              # Task workflow state badges
│   └── map/
│       └── LocationSelectorMap.tsx      # OpenStreetMap Leaflet Location Picker
├── context/
│   └── AuthContext.tsx                  # Global client authentication state
├── lib/
│   ├── auth.ts                          # JWT, bcrypt, cookie authorization
│   ├── db.ts                            # Universal MongoDB / Resilient adapter
│   ├── geo.ts                           # Haversine distance & radius expansion
│   ├── matching.ts                      # Deterministic rule-based matching
│   └── storage.ts                       # Secure private KYC document storage
├── models/
│   ├── AssistanceRequest.ts             # Assistance request Mongoose schema
│   ├── Assignment.ts                    # Task assignment Mongoose schema
│   ├── KycReview.ts                     # KYC review audit log schema
│   ├── Notification.ts                  # In-app notification schema
│   ├── User.ts                          # User account Mongoose schema
│   └── VolunteerProfile.ts              # Volunteer profile & KYC schema
├── scripts/
│   └── seed.ts                          # Comprehensive demo database seeder
├── storage/                             # Private storage directory (git-ignored)
│   └── kyc_documents/                   # Vault for volunteer identity files
├── types/
│   └── index.ts                         # Complete TypeScript domain models
├── .env.example                         # Environment configuration template
├── next.config.js                       # Next.js build configuration
├── package.json                         # Dependencies & scripts
├── postcss.config.js                    # PostCSS configuration
├── tailwind.config.js                   # Accessible calm color palette
└── tsconfig.json                        # TypeScript configuration
```

---

## 🔑 Test & Demo Personas (Pre-seeded)

All demo accounts use the standard password: `Password123!`

| Role | Name | Email | Persona Details |
|---|---|---|---|
| **Coordinator** | Sarah Jenkins | `admin@careconnect.org` | Primary Care Coordinator & KYC Reviewer |
| **Coordinator** | David Kumar | `david@careconnect.org` | Zonal Field Dispatcher |
| **Requester** | Kamala Devi | `kamala@careconnect.org` | 78 yrs, Jayanagar (Active Medicine Request) |
| **Requester** | Robert Pinto | `robert@careconnect.org` | 64 yrs, Koramangala (Active Task with Rahul) |
| **Requester** | Anita Sharma | `anita@careconnect.org` | Caregiver in Indiranagar |
| **Volunteer (Approved)** | Rahul Verma | `rahul@careconnect.org` | Verified (14 completed tasks, Koramangala) |
| **Volunteer (Approved)** | Priya Nair | `priya@careconnect.org` | Verified (22 completed tasks, Jayanagar) |
| **Volunteer (Approved)** | Amit Patel | `amit@careconnect.org` | Verified (Indiranagar, Companionship/Visits) |
| **Volunteer (Pending)** | Vikram Singh | `vikram@careconnect.org` | **Pending KYC** (Document uploaded for review) |
| **Volunteer (Pending)** | Deepa Krishnan | `deepa@careconnect.org` | **Pending KYC** (Whitefield area) |
| **Volunteer (Rejected)** | Karthik Rajan | `karthik@careconnect.org` | **Rejected KYC** (Reason: blurry image) |

> 💡 **Tip:** You can switch between any of these accounts in 1 click using the **"Switch Demo Role"** dropdown located in the top navigation bar!

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- npm `v9+` or `v10+` or `v11+`
- Optional: MongoDB running locally or a MongoDB Atlas URI (if not present, the app automatically falls back to the embedded JSON persistence adapter).

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/careconnect.git
cd careconnect

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the example environment configuration:
```bash
cp .env.example .env.local
```

Contents of `.env.local`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/careconnect
JWT_SECRET=careconnect_super_secret_jwt_key_2026_elderly_assistance
KYC_STORAGE_DIR=./storage/kyc_documents
```

### 4. Seed the Database
Populate the database with demo coordinators, requesters, verified volunteers, pending KYC uploads, active assignments, and completion-pending requests:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open your browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/register` — Register a new requester or volunteer.
- `POST /api/auth/login` — Sign in and receive HTTP-only session cookie & JWT.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Retrieve current session user and live volunteer KYC status.

### Assistance Requests
- `POST /api/requests` — Create request with address and coordinates; triggers matching step.
- `GET /api/requests` — Retrieve requests (supports `?my=true` and `?status=ACTIVE`).
- `GET /api/requests/:id` — Retrieve single request with populated volunteer/requester.
- `POST /api/requests/:id/cancel` — Cancel pending/matching request.

### Matching & Dynamic Radius
- `POST /api/matching/start` — Initiate rule-based matching for a request.
- `POST /api/matching/expand` — Dynamically expand search radius (`2km -> 5km -> 10km -> 15km`).
- `POST /api/matching/accept` — Approved volunteer accepts request (transitions to `ACTIVE`).
- `POST /api/matching/decline` — Volunteer declines request (triggers re-matching/radius expansion).

### KYC Verification
- `POST /api/kyc/submit` — Volunteer uploads identity document (JPEG/PNG/PDF).
- `GET /api/kyc/pending` — Coordinator retrieves pending verification queue.
- `GET /api/kyc/:id` — Coordinator inspects volunteer KYC file details.
- `POST /api/kyc/:id/approve` — Coordinator approves volunteer (sets status `APPROVED`).
- `POST /api/kyc/:id/reject` — Coordinator rejects volunteer with mandatory reason.
- `POST /api/kyc/:id/suspend` — Coordinator suspends volunteer account.
- `GET /api/kyc/document/:id` — **Protected**: Streams document strictly to authorized coordinators.

### Task Completion & Confirmation
- `POST /api/tasks/:id/complete` — Volunteer marks task complete (`COMPLETION_PENDING`).
- `POST /api/tasks/:id/confirm` — Requester confirms completion using verification code (e.g. `CARE-4821`).

### Coordinator Endpoints
- `GET /api/coordinator/dashboard` — Overview statistics, active queues, recent assignments.
- `GET /api/coordinator/requests` — Filterable request roster.
- `GET /api/coordinator/volunteers` — Volunteer capabilities and KYC directory.
- `GET /api/coordinator/history` — Audit logs of completed missions and KYC reviews.

---

## 🛡️ Security Measures
- **Password Protection**: Passwords are salted and hashed using `bcryptjs` with 10 salt rounds.
- **Role Verification**: Middleware validates authorization on every protected route.
- **Restricted KYC File Vault**: Identity documents are stored outside the public directory. Document IDs are cryptographically randomized UUIDs, and downloads require active coordinator credentials.
- **Elderly Safety**: Requester confirmation code prevents unauthorized or premature task closure.

---

## 🚢 Production Deployment

To build and start the optimized production bundle:
```bash
npm run build
npm run start
```
CareConnect is optimized for deployment on platforms such as **Vercel**, **AWS ECS/EC2**, **Render**, or **Docker** containers. For MongoDB, connect any **MongoDB Atlas** connection string in `MONGODB_URI`.
