# Delhi CM Grievance Redressal Dashboard

An interactive, role-based public grievance management and resolution dashboard for the Government of Delhi. This portal connects citizens reporting local infrastructure issues (roads, water, waste, power, safety) directly to regional department engineers with automated routing, full audit logs, quality checks, and CM cell oversight.

---

## 🚀 Key Features

*   **Role-Based Access Control (RBAC)**: Distinct dashboards and layouts for the **Chief Minister (CM) Cell**, **State Administrator**, **Department Officers (PWD, DJB, MCD, etc.)**, and **Citizens**.
*   **Intelligent Auto-Routing**: Newly reported complaints are automatically assigned to the active engineer in the corresponding department who currently has the lowest active workload.
*   **GIS Mapping & Analytics**: Interactive Leaflet maps marking hot spots, regional analytics scorecards, and charts showing historical grievance trends.
*   **Resolution Audit Timeline**: Full history trail tracking every grievance action from registration to dispatch, in-progress inspection, proof upload, and citizen ratings.
*   **Quality Assurance Triggers**:
    *   **Auto-Reopen**: If a citizen rates a resolved complaint poorly (< 3 stars), the ticket is automatically reopened and sent back to the officer's workload queue.
    *   **10% Random Audits**: 10% of resolved cases are automatically selected at random for physical validation inspections by third-party inspectors.
*   **CM Tour Planner**: Integrates the Chief Minister's surprise local tour schedules with grievance density mapping to brief field workers automatically.

---

## 🛠️ Technology Stack

*   **Frontend**: React (with React Router DOM for routing)
*   **Build Tool**: Vite
*   **Styling & UI Components**: Material-UI (MUI v5)
*   **Interactive Maps**: React Leaflet / Leaflet.js
*   **Visual Charts**: Recharts
*   **Backend & Auth Database**: Supabase (PostgreSQL with Auth GoTrue)

---

## 📋 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Install Dependencies
Clone the repository and install packages:
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and configure your Supabase project credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Database Setup & Seeding
Copy the contents of the database setup script located at `supabase/supabase_editor_setup.sql`. 
Paste and execute the script inside your **Supabase SQL Editor** to initialize:
*   Database tables, relationships, and extensions.
*   Workload tracking, audit logging, and auto-reopening Postgres triggers.
*   Pre-seeded demo user profiles.

*Note: If you run into database GoTrue schema issues on your Supabase instance, execute the fix query inside your SQL editor to clean up NULL values:*
```sql
UPDATE auth.users
SET confirmation_token = '', recovery_token = '', email_change_token_new = '', email_change = '', phone_change_token = ''
WHERE confirmation_token IS NULL OR recovery_token IS NULL OR email_change_token_new IS NULL OR email_change IS NULL OR phone_change_token IS NULL;
```

### 5. Run the Local Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 🔐 Quick Demo Logins
Use the following pre-seeded demo accounts to test different roles (all share the password `password`):

*   👑 **Chief Minister**: `cm@delhi.gov.in`
*   ⚙️ **State Administrator**: `admin@delhi.gov.in`
*   👷 **PWD Engineer**: `pwd.officer@delhi.gov.in`
*   👤 **Citizen**: `priya@gmail.com`

---

## ☁️ Deployment Guidelines

The project includes configuration files ([public/_redirects](public/_redirects) for Netlify and [vercel.json](vercel.json) for Vercel) to support SPA routing redirects seamlessly.

### Deploying to Vercel or Netlify via GitHub
1. Create a repository on GitHub and push your code.
2. Link the repository to your hosting service (Vercel/Netlify).
3. Set the following build options:
   *   **Build Command**: `npm run build`
   *   **Publish/Output Directory**: `dist`
4. Add your **Environment Variables** (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the host's dashboard settings.
5. Deploy!
