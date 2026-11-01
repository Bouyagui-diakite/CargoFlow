# CargoFlow — Air Freight Management System

A professional admin panel for air freight operations: AWB management, DGR compliance (IATA), NOTOC generation, flight tracking, and role-based access control.

---

## Quick Start (Frontend)

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cargoflow.mr | admin123 |
| Supervisor | super@cargoflow.mr | super123 |
| Cargo Agent | agent@cargoflow.mr | agent123 |

---

## Backend Setup (Laravel)

### Requirements
- PHP 8.2+
- Composer
- MySQL 8+ or PostgreSQL 15+

### Install

```bash
# Install Laravel via Composer (in backend/)
cd backend
composer create-project laravel/laravel . --prefer-dist
composer require laravel/sanctum spatie/laravel-permission spatie/laravel-activitylog barryvdh/laravel-dompdf

# Configure .env
cp .env.example .env
php artisan key:generate

# DB config in .env:
# DB_DATABASE=cargoflow
# DB_USERNAME=your_user
# DB_PASSWORD=your_password

# Run migrations + seed
php artisan migrate --seed

# Start server
php artisan serve
```

---

## Architecture

### Frontend (React + Vite)
```
src/
├── components/
│   ├── layout/      Sidebar, Header, Layout
│   └── ui/          Badge, Button, Card, Modal, Table, Input, Alert
├── pages/
│   ├── auth/        Login
│   ├── awb/         AWBList, AWBCreate, AWBDetail
│   ├── dgr/         DGRList, NOTOCView
│   ├── flights/     FlightList, FlightCreate
│   ├── users/       UserList
│   └── documents/   DocumentList
├── context/         AuthContext (auth, permissions)
├── data/            mockData.js (demo data)
└── lib/             utils.js (formatters, constants)
```

### Backend (Laravel)
```
app/
├── Models/           AWB, DGR, Flight, Document, User
├── Http/Controllers/ AWBController, DGRController, FlightController…
└── Policies/         AWBPolicy, DGRPolicy (RBAC)
database/
└── migrations/       AWBs, DGR declarations, flights, documents
routes/
└── api.php           RESTful API routes
```

---

## Modules

### AWB (Air Waybill)
- MAWB number auto-generation (prefix-serial format per IATA)
- Full shipper/consignee data
- Status workflow: received → processing → loaded → in_transit → delivered / blocked
- Special handling codes: PER, ICE, HEA, MED, CAO, etc.
- Flight assignment with capacity enforcement

### DGR (Dangerous Goods)
- IATA DGR class selection (Classes 1–9)
- UN number, ERG code, packing group
- Net quantity and packaging certification
- Supervisor approval workflow
- Automatic NOTOC generation on approval

### NOTOC (Notification to Captain)
- Auto-generated PDF from approved DGR
- Contains: flight, route, UN number, class, ERG, emergency contact
- Captain acknowledgement section
- Reference numbering: NOTOC-YYYY-XXXX

### Flights
- Flight schedule (origin → destination, IATA codes)
- Real-time load percentage tracking
- Overload alerts (>100% capacity)
- DGR flag on manifest

### Users & Permissions

| Role | Permissions |
|------|-------------|
| Admin | All permissions + user management + audit log |
| Supervisor | Create/edit AWB, approve DGR, manage flights, view logs |
| Cargo Agent | Create AWB, edit AWB |
| Ground Handler | Read-only |

---

## Security
- Laravel Sanctum (token-based auth)
- Spatie Laravel Permission (RBAC)
- Spatie Laravel Activitylog (complete audit trail)
- Policy-based authorization on all write actions

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Recharts |
| Backend | Laravel 11, PHP 8.2+ |
| Auth | Laravel Sanctum |
| RBAC | Spatie Laravel Permission |
| Audit | Spatie Laravel Activitylog |
| PDF | barryvdh/laravel-dompdf |
| Database | MySQL 8 / PostgreSQL 15 |



