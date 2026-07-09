# ABU Hostel — Hostel Management System

A comprehensive digital platform for **Ahmadu Bello University, Zaria** hostel management. Students can browse hostels, reserve beds, submit complaints, and track clearance — all from a single modern web portal. Administrators get real-time occupancy tracking, complaint management, and billing tools.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/Password + Google OAuth) |
| State | TanStack React Query |
| Routing | React Router v6 |

---

## 📋 Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Supabase](https://supabase.com) account **OR** Docker Desktop (for local offline mode)

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

Create a `.env` file in the project root (or update the existing one):

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

> See [Cloud Setup](#-option-a-supabase-cloud-online) or [Local Setup](#-option-b-local-supabase-offline--docker) below for how to get these values.

### 4. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:8080**

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |

---

## 🗄️ Database

### Database Name / Provider

**Supabase** — powered by **PostgreSQL** under the hood.

The database name in local mode is: **`postgres`**  
Connection string (local): `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### Schema Overview

```
auth.users                  ← managed by Supabase Auth
│
├── profiles                ← student profile info (name, matric, phone, program)
├── user_roles              ← role per user: 'student' | 'admin'
│
├── hostels                 ← hostel buildings (Umar Sulaim, Amina, etc.)
│   └── blocks              ← blocks within each hostel (Block A, B, ...)
│       └── rooms           ← rooms within each block (capacity, type, price)
│           └── allocations ← student bed assignments (bed_label, term, status)
│           └── messages    ← roommate chat per room (realtime)
│
├── complaints              ← maintenance / service tickets
├── clearance_items         ← move-in/move-out clearance steps
└── notifications           ← in-app notifications (realtime)
```

### Tables at a Glance

| Table | Key Columns |
|-------|-------------|
| `profiles` | `id`, `full_name`, `matric_number`, `phone`, `program` |
| `user_roles` | `user_id`, `role` (`student` \| `admin`) |
| `hostels` | `name`, `description`, `campus`, `gender` |
| `blocks` | `hostel_id`, `name`, `floors` |
| `rooms` | `block_id`, `room_number`, `capacity`, `room_type`, `price_per_term` |
| `allocations` | `student_id`, `room_id`, `bed_label`, `term`, `status` |
| `complaints` | `student_id`, `title`, `category`, `priority`, `status` |
| `clearance_items` | `student_id`, `item`, `status`, `verified_by` |
| `messages` | `room_id`, `sender_id`, `body` |
| `notifications` | `user_id`, `title`, `body`, `read` |

### Enums

| Enum | Values |
|------|--------|
| `app_role` | `student`, `admin` |
| `allocation_status` | `active`, `expired`, `cancelled` |
| `complaint_status` | `open`, `in_progress`, `resolved`, `closed` |
| `complaint_priority` | `low`, `medium`, `high` |
| `clearance_status` | `pending`, `verified`, `rejected` |
| `hostel_gender` | `male`, `female`, `mixed` |

---

## ☁️ Option A: Supabase Cloud (Online)

### 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New Project** and fill in the details
3. Wait for the project to provision (~2 minutes)

### 2. Get your credentials

In your Supabase dashboard → **Project Settings → API**:

- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon / public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

Paste them into your `.env` file.

### 3. Apply the database migrations

Install the Supabase CLI if you haven't:

```bash
brew install supabase/tap/supabase
```

Link your project and push migrations:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

Or copy-paste the SQL files from `supabase/migrations/` directly into the **SQL Editor** in your Supabase dashboard.

---

## 🐳 Option B: Local Supabase (Offline — with Docker)

This runs the full Supabase stack on your machine. **No internet required** after initial setup.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**
- Supabase CLI: `brew install supabase/tap/supabase`

### 1. Start local Supabase

```bash
cd lodgingly-pro
supabase start
```

This downloads and starts PostgreSQL, Auth, Storage, and the REST API locally via Docker. First run may take a few minutes.

### 2. Note the local credentials

After starting, you will see output like:

```
         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324   ← captures auth emails locally
        anon key: eyJ...
service_role key: eyJ...
```

### 3. Update your `.env` with local credentials

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key from above>
```

### 4. Apply migrations

```bash
supabase db reset
```

This runs all SQL files in `supabase/migrations/` against your local database, including seed data.

### 5. Open local Studio (database GUI)

Visit **http://127.0.0.1:54323** — this is the full Supabase dashboard running offline.

### Stopping / restarting

```bash
supabase stop              # stop all containers (data is preserved)
supabase stop --no-backup  # stop and wipe all local data
supabase start             # start again
```

---

## 🖥️ Option C: Local PostgreSQL Only (without Docker)

If you do not want Docker, you can connect directly to a **local PostgreSQL** installation. Note that Supabase Auth middleware won't be available — this is best suited for inspecting/editing data only.

### Prerequisites

- [PostgreSQL 15+](https://www.postgresql.org/download/) installed locally
- `psql` available in your terminal

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE abu_hostel;"
```

### 2. Apply the schema manually

```bash
psql -U postgres -d abu_hostel -f supabase/migrations/20260705081135_4f586063-5832-42c9-9f92-35b5dfe9a45f.sql
psql -U postgres -d abu_hostel -f supabase/migrations/20260705081143_1d6960ff-68eb-4939-90ac-6a8612b3bc2b.sql
psql -U postgres -d abu_hostel -f supabase/migrations/20260709091456_9feeadfd-49af-40ec-b673-4fab8234d8d9.sql
```

### 3. Note

A raw PostgreSQL connection alone does not provide the JWT-based auth that the app requires. For a fully working offline experience use **Option B (Docker)**.

---

## 👤 User Roles

| Role | Default | Access |
|------|---------|--------|
| `student` | ✅ All new sign-ups | Dashboard, Accommodation, Complaints |
| `admin` | ❌ Must be manually assigned | All student pages + Admin Overview |

### Promoting a user to admin

Run this in the Supabase SQL Editor (cloud dashboard or local Studio at port 54323):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<paste-user-uuid-here>', 'admin');
```

---

## 📁 Project Structure

```
lodgingly-pro/
├── src/
│   ├── assets/          # Images (hostel photos, ABU logo, bg image)
│   ├── components/      # Reusable UI components
│   │   ├── AppShell.tsx # Sidebar + header layout for authenticated pages
│   │   ├── Logo.tsx     # ABU Hostel logo component
│   │   └── ui/          # shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── hooks/           # useAuth, use-toast, use-mobile
│   ├── integrations/
│   │   └── supabase/    # Supabase client + generated TypeScript types
│   ├── pages/
│   │   ├── Landing.tsx           # Public marketing homepage
│   │   ├── Auth.tsx              # Login / Sign-up page
│   │   ├── StudentDashboard.tsx  # Student home (allocation + complaints)
│   │   ├── Accommodation.tsx     # Browse & reserve hostel rooms
│   │   └── AdminDashboard.tsx    # Admin occupancy + complaint overview
│   └── App.tsx          # Route definitions + auth providers
├── supabase/
│   ├── config.toml      # Local Supabase project config
│   └── migrations/      # All SQL schema, RLS policies, and seed data
├── public/              # Static assets (favicon, logos)
├── .env                 # Environment variables (never commit to git)
└── package.json
```

---

## 🔐 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL or local `http://127.0.0.1:54321` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase `anon` public key |

> ⚠️ **Never** commit your `.env` file or `service_role` key to version control. The `.env` file is already listed in `.gitignore`.

---

## 📜 License

Developed as part of a final year project on the **Design and Implementation of a Hostel Management System** at **Ahmadu Bello University, Zaria**.
