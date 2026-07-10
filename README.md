# ABU Hostel — Hostel Management System

A comprehensive digital platform for **Ahmadu Bello University, Zaria** hostel management. Students can browse hostels, reserve beds, submit complaints, track clearance, and communicate via a message board — all from a single modern web portal. Administrators get real-time occupancy tracking, complaint management, user accounts control, and billing tools.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Backend API** | Node.js + Express + TypeScript (`tsx`) |
| **Database** | MongoDB Atlas / Local MongoDB (Mongoose ODM) |
| **Auth** | Custom JWT (JSON Web Token) Authentication |
| **State** | TanStack React Query |
| **Routing** | React Router v6 |

---

## 📋 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A **MongoDB** database (either a local instance or a cloud MongoDB Atlas cluster)

---

## ⚙️ Running the App

### 1. Clone the repository

```bash
git clone https://github.com/abubakarsd/lodgingly-pro.git
cd lodgingly-pro
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
MONGODB_URL="mongodb+srv://<username>:<password>@cluster0.cc13bhd.mongodb.net/ABU-Hostel-System?appName=Cluster0"
JWT_SECRET="your-secure-jwt-secret-key"
```

> **Note**: Do not commit the `.env` file to version control. It is already added to `.gitignore`.

### 4. Seed the database

Populate the database with initial hostels, block layouts, rooms, and default users (admin and student accounts):

```bash
npm run seed
```

### 5. Start the development server

Start both the Express backend server (port 3000) and the Vite frontend dev server (port 8080) concurrently:

```bash
npm run dev
```

The app will be available at **http://localhost:8080**.

---

## 🗄️ Database Schema & Models

The database models are defined using **Mongoose** in `server/models.ts`.

### Relationships Overview

```
User (profiles)             ← students & administrators
 │
 ├── Hostels                 ← hostel buildings (Umar Sulaim, Amina, etc.)
 │    └── Blocks             ← blocks within each hostel (Block A, B, ...)
 │         └── Rooms         ← rooms within each block (capacity, type, price)
 │              └── Allocations ← student bed assignments (bed_label, term, status)
 │              └── Messages    ← general board chats (realtime)
 │
 ├── Complaints              ← maintenance / service tickets
 ├── ClearanceItems          ← student clearance statuses
 └── Notifications           ← in-app user inbox alerts
```

### Tables at a Glance

| Model | Schema Fields |
|-------|-------------|
| **User** | `_id`, `email`, `password` (hashed), `full_name`, `matric_number`, `role` (`student` \| `admin`), `phone`, `program`, `avatar_url` |
| **Hostel** | `_id`, `name`, `description`, `campus`, `gender`, `image_url` |
| **Block** | `_id`, `hostel_id` (ref Hostel), `name`, `floors` |
| **Room** | `_id`, `block_id` (ref Block), `room_number`, `capacity`, `room_type`, `price_per_term` |
| **Allocation** | `_id`, `student_id` (ref User), `room_id` (ref Room), `bed_label`, `term`, `status` (`active` \| `expired` \| `cancelled`) |
| **Complaint** | `_id`, `student_id` (ref User), `category`, `title`, `description`, `priority` (`low` \| `medium` \| `high`), `status` (`open` \| `in_progress` \| `resolved` \| `closed`) |
| **Message** | `_id`, `room_id` (default 'general-board'), `sender_id` (ref User), `body` |
| **Notification** | `_id`, `user_id` (ref User), `title`, `body`, `read` (boolean) |
| **ClearanceItem** | `_id`, `student_id` (ref User), `item`, `status` (`pending` \| `verified` \| `rejected`), `verified_by` (ref User) |

---

## 👤 User Roles & Default Logins

The database includes two default seeded users for ease of testing:

| Role | Email | Password | Matric Number |
|------|-------|----------|---------------|
| **Administrator** | `admin@abu.edu.ng` | `adminpassword` | N/A |
| **Student** | `student@abu.edu.ng` | `studentpassword` | `U16CSC206` |

---

## 📁 Project Structure

```
lodgingly-pro/
├── server/
│   ├── index.ts         # Express server & MongoDB CRUD/Auth routing
│   ├── models.ts        # Mongoose schema definitions and models
│   └── seed.ts          # Database seed script for initial testing data
├── src/
│   ├── assets/          # Images (hostel photos, ABU logo, bg image)
│   ├── components/      # Reusable UI components
│   │   ├── AppShell.tsx # Sticky sidebar + header layout
│   │   ├── Logo.tsx     # ABU Hostel logo
│   │   └── ui/          # shadcn/ui primitives (Button, Table, Dialog, etc.)
│   ├── hooks/           # useAuth hook, toast utilities
│   ├── integrations/
│   │   └── supabase/    # Supabase layout wrapper mapping requests to the Express server
│   ├── pages/
│   │   ├── Landing.tsx       # Marketing landing page
│   │   ├── Auth.tsx          # Login / Sign-up page
│   │   ├── StudentDashboard.tsx # Student overview
│   │   ├── Accommodation.tsx # Hostel browser & bed reservations
│   │   ├── Clearance.tsx     # Student clearance checks & Admin verification
│   │   ├── Users.tsx         # Admin accounts control page (CRUD)
│   │   ├── Allocations.tsx   # Admin bed space allocations manager
│   │   ├── Complaints.tsx    # Maintenance tickets filer & board
│   │   ├── Messages.tsx      # General discussion board
│   │   └── Notifications.tsx # User alerts inbox
│   └── App.tsx          # Router config with Protected Route guards
├── vercel.json          # Deployment routing rewrites configuration
├── .env                 # Environment variables file (ignored by Git)
└── package.json
```

---

## 📜 License

Developed as part of a final year project on the **Design and Implementation of a Hostel Management System** at **Ahmadu Bello University, Zaria**.
