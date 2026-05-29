# 🐄 LiveStock RW — Traceability & Compliance Platform

A full-stack livestock treatment traceability and withdrawal compliance platform built with **Node.js + Express + MongoDB** (backend) and **React + Vite + Tailwind CSS** (frontend).

---

## 🏗️ Architecture

```
livestock-system/
├── backend/               # Express + MongoDB API
│   ├── models/            # Mongoose schemas
│   ├── routes/            # REST API routes
│   ├── middleware/        # Auth (JWT) + file upload
│   ├── utils/             # Email, cron jobs, seed admin
│   └── server.js          # Entry point
└── frontend/              # React + Vite + Tailwind
    └── src/
        ├── pages/         # Role-based page components
        │   ├── farmer/    # MyAnimals, AnimalDetail, MyMedicines
        │   ├── vet/       # TreatmentRecords, NewTreatment, AllDiagnoses
        │   ├── pharmacist/# MedicineInventory, SellMedicine, SalesRecords
        │   ├── center/    # CenterStakeholders, FarmerCompliance
        │   ├── admin/     # AdminDashboard, AdminUsers, AdminLocations
        │   └── inspector/ # InspectorOverview
        ├── components/    # DashboardLayout (sidebar + nav)
        ├── context/       # AuthContext (JWT session)
        └── utils/         # Axios instance (api.js)
```

---

## 👥 User Roles & Capabilities

| Role | Capabilities |
|------|-------------|
| **Farmer** | Register animals, report issues, view treatment records, confirm medicine doses |
| **Veterinarian** | Record diagnoses & treatments, view all cases, analytics |
| **Pharmacist** | Register medicines/food, sell to farmers, auto-schedule doses |
| **Milk Center / Slaughterhouse** | Manage farmer stakeholders, check compliance before accepting |
| **Inspector** | View all treatments, restricted animals, compliance reports |
| **Admin** | Full system control — manage all users, create inspectors, manage locations |

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm

---

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, email credentials, JWT secret
npm run dev
```

The server starts on **http://localhost:5000**

On first start, a default admin is seeded:
- **Email:** admin@livestock.rw
- **Password:** Admin@1234

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app opens at **http://localhost:5173**

The Vite proxy forwards `/api/*` → `http://localhost:5000` automatically.

---

## ⚙️ Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/livestock_db
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

ADMIN_EMAIL=admin@livestock.rw
ADMIN_PASSWORD=Admin@1234

CLIENT_URL=http://localhost:5173
```

---

## 📡 API Reference

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register (farmer, vet, pharmacist, center) |
| POST | `/api/auth/login` | Login — returns JWT |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile (name, phone, image) |
| PUT | `/api/auth/password` | Change password |

### Animals
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/animals` | List animals (farmer sees own) |
| POST | `/api/animals` | Register new animal |
| GET | `/api/animals/:id` | Animal detail |
| PUT | `/api/animals/:id` | Update animal |
| POST | `/api/animals/:id/report-issue` | Farmer reports illness → notifies vets |
| PUT | `/api/animals/:id/status` | Update status (vet/admin/inspector) |

### Medicines
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/medicines` | List medicines |
| POST | `/api/medicines` | Register medicine (pharmacist) |
| PUT | `/api/medicines/:id` | Update medicine |
| POST | `/api/medicines/sell` | Sell to farmer + generate schedule |
| GET | `/api/medicines/sales` | List sales records |
| PUT | `/api/medicines/sales/:id/confirm-dose` | Farmer confirms dose given |

### Treatments
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/treatments` | List treatments |
| POST | `/api/treatments` | Record treatment (vet) |
| PUT | `/api/treatments/:id` | Update treatment |
| GET | `/api/treatments/:id` | Treatment detail |

### Centers
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/centers` | List all centers |
| POST | `/api/centers/stakeholders` | Farmer requests to join center |
| GET | `/api/centers/stakeholders` | List stakeholders |
| PUT | `/api/centers/stakeholders/:id` | Approve/reject farmer |
| GET | `/api/centers/farmers/:id/compliance` | Check farmer compliance |

### Admin
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | System stats |
| GET | `/api/admin/users` | All users |
| POST | `/api/admin/inspectors` | Create inspector |
| PUT | `/api/admin/users/:id/toggle-active` | Activate/deactivate |
| DELETE | `/api/admin/users/:id` | Delete user |

### Locations
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/locations/sectors` | All sectors |
| GET | `/api/locations/sectors/:id/cells` | Cells in sector |
| GET | `/api/locations/cells/:id/villages` | Villages in cell |
| POST | `/api/locations/sectors` | Add sector (admin) |
| POST | `/api/locations/cells` | Add cell (admin) |
| POST | `/api/locations/villages` | Add village (admin) |

### Notifications
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notifications` | My notifications |
| GET | `/api/notifications/unread-count` | Unread count |
| PUT | `/api/notifications/:id/read` | Mark one read |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## ⏰ Automated Cron Jobs

| Schedule | Job |
|----------|-----|
| Every hour | Send feeding reminders for upcoming doses |
| Every hour | Check medicine expiry — warn 7 days before |
| Daily 8am | Lift withdrawal restrictions that have ended |

---

## 🔑 Key Business Rules

1. **Animal Restriction:** When a vet records a treatment or pharmacist sells medicine with withdrawal period > 0, the animal is automatically marked `restricted`.
2. **Withdrawal Lifting:** Cron job runs daily and automatically lifts restrictions when `restrictionUntil` date passes.
3. **Compliance Check:** Slaughterhouses/milk centers can check if a farmer's animals are all clear before accepting milk/animals.
4. **Issue Reporting:** When a farmer reports an animal issue, ALL vets in the system receive an in-app notification + email.
5. **Feeding Reminders:** Farmer gets in-app + email reminder 1 hour before each scheduled dose.
6. **Inspector created by Admin:** Inspectors don't self-register; admin creates their accounts.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jsonwebtoken) |
| Emails | Nodemailer |
| Cron | node-cron |
| File Upload | Multer |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Toasts | React Hot Toast |
| PWA | Web App Manifest |
