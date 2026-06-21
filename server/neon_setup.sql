-- ====================================================================
-- DELHI CM GRIEVANCE DASHBOARD - NEONDB SETUP SCRIPT
-- ====================================================================
-- Run this entire script in your NeonDB SQL Editor to initialize the database.
-- NeonDB is plain PostgreSQL - no Supabase-specific extensions needed.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (clean slate)
-- ------------------------------------------------------------------
DROP TABLE IF EXISTS public.re_inspections CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.visit_logs CASCADE;
DROP TABLE IF EXISTS public.complaint_timeline CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.officers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;

-- ------------------------------------------------------------------
-- 2. DEPARTMENTS TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    active_officers_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 3. USERS TABLE (with password_hash - no Supabase auth needed)
-- ------------------------------------------------------------------
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('cm', 'admin', 'officer', 'citizen')),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    district VARCHAR(100),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 4. OFFICERS TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    workload_count INT DEFAULT 0,
    max_workload INT DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    avg_rating DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 5. COMPLAINTS TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_no VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'reopened', 'escalated')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    district VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL DEFAULT 28.6139,
    longitude DECIMAL(9, 6) NOT NULL DEFAULT 77.2090,
    photo_before TEXT,
    photo_after TEXT,
    citizen_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 6. COMPLAINT TIMELINE TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.complaint_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    action_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_by_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 7. VISIT LOGS TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    complaint_count_at_visit INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 8. FEEDBACK TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 9. RE-INSPECTIONS TABLE
-- ------------------------------------------------------------------
CREATE TABLE public.re_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    assigned_inspector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 10. AUTO-ESCALATION FUNCTION
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auto_escalate_old_complaints()
RETURNS INTEGER AS $$
DECLARE
    escalated_count INTEGER := 0;
BEGIN
    UPDATE public.complaints
    SET status = 'escalated', updated_at = NOW()
    WHERE status IN ('pending', 'assigned', 'in_progress')
      AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS escalated_count = ROW_COUNT;
    RETURN escalated_count;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- 11. INDEXES FOR PERFORMANCE
-- ------------------------------------------------------------------
CREATE INDEX idx_complaints_status ON public.complaints(status);
CREATE INDEX idx_complaints_district ON public.complaints(district);
CREATE INDEX idx_complaints_tracking_no ON public.complaints(tracking_no);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at DESC);
CREATE INDEX idx_complaints_department_id ON public.complaints(department_id);
CREATE INDEX idx_complaints_assigned_officer ON public.complaints(assigned_officer_id);
CREATE INDEX idx_timeline_complaint_id ON public.complaint_timeline(complaint_id);
CREATE INDEX idx_feedback_complaint_id ON public.feedback(complaint_id);

-- ------------------------------------------------------------------
-- 12. SEED DATA: DEPARTMENTS (valid UUID hex only)
-- ------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, active_officers_count, rating) VALUES
('d0000001-0000-4000-a000-000000000001', 'Public Works Department (PWD)', 'PWD', 1, 4.2),
('d0000001-0000-4000-a000-000000000002', 'Delhi Jal Board (DJB)', 'DJB', 1, 3.8),
('d0000001-0000-4000-a000-000000000003', 'MCD Garbage & Sanitation', 'MCD', 1, 4.5),
('d0000001-0000-4000-a000-000000000004', 'Power & Electricity (DISCOMs)', 'DISCOM', 1, 4.7),
('d0000001-0000-4000-a000-000000000005', 'Delhi Police & Security', 'POLICE', 1, 4.1);

-- ------------------------------------------------------------------
-- 13. SEED DATA: DEMO USERS
--     Passwords are all 'password' hashed with bcrypt (10 rounds)
-- ------------------------------------------------------------------
INSERT INTO public.users (id, email, password_hash, role, full_name, phone, district, department_id) VALUES
('a0000001-0000-4000-a000-000000000001', 'cm@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cm', 'Hon. Chief Minister', '9876543201', 'New Delhi', NULL),
('a0000001-0000-4000-a000-000000000002', 'admin@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Rajesh Kumar (State Admin)', '9876543202', 'Central Delhi', NULL),
('a0000001-0000-4000-a000-000000000003', 'pwd.officer@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'officer', 'S.K. Sharma (EE, PWD)', '9876543203', 'North Delhi', 'd0000001-0000-4000-a000-000000000001'),
('a0000001-0000-4000-a000-000000000004', 'djb.officer@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'officer', 'Meena Das (AE, DJB)', '9876543204', 'South Delhi', 'd0000001-0000-4000-a000-000000000002'),
('a0000001-0000-4000-a000-000000000005', 'mcd.officer@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'officer', 'Rakesh Yadav (SI, MCD)', '9876543205', 'East Delhi', 'd0000001-0000-4000-a000-000000000003'),
('a0000001-0000-4000-a000-000000000006', 'discom.officer@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'officer', 'Anil Gupta (SE, DISCOM)', '9876543206', 'West Delhi', 'd0000001-0000-4000-a000-000000000004'),
('a0000001-0000-4000-a000-000000000007', 'police.officer@delhi.gov.in', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'officer', 'SHO Amit Singh', '9876543207', 'New Delhi', 'd0000001-0000-4000-a000-000000000005'),
('a0000001-0000-4000-a000-000000000008', 'priya@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', 'Priya Sharma (Citizen)', '9876543210', 'South West Delhi', NULL);

-- ------------------------------------------------------------------
-- 14. SEED DATA: OFFICERS
-- ------------------------------------------------------------------
INSERT INTO public.officers (user_id, department_id, workload_count, max_workload, is_active, avg_rating) VALUES
('a0000001-0000-4000-a000-000000000003', 'd0000001-0000-4000-a000-000000000001', 1, 15, true, 3.8),
('a0000001-0000-4000-a000-000000000004', 'd0000001-0000-4000-a000-000000000002', 1, 15, true, 3.2),
('a0000001-0000-4000-a000-000000000005', 'd0000001-0000-4000-a000-000000000003', 0, 15, true, 3.5),
('a0000001-0000-4000-a000-000000000006', 'd0000001-0000-4000-a000-000000000004', 1, 15, true, 4.5),
('a0000001-0000-4000-a000-000000000007', 'd0000001-0000-4000-a000-000000000005', 1, 15, true, 4.1);

-- ------------------------------------------------------------------
-- 15. SEED DATA: SAMPLE COMPLAINTS
-- ------------------------------------------------------------------
INSERT INTO public.complaints (id, tracking_no, title, description, category, department_id, status, severity, district, latitude, longitude, photo_before, citizen_id, created_at, updated_at) VALUES
(
    'b0000001-0000-4000-a000-000000000001', 'DL-2026-8921',
    'Severe pothole cluster on Ring Road near Lajpat Nagar',
    'A cluster of deep potholes is causing severe traffic congestion and minor accidents. Needs immediate resurfacing.',
    'Roads / Potholes', 'd0000001-0000-4000-a000-000000000001', 'assigned', 'high',
    'South East Delhi', 28.5678, 77.2435,
    'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    'a0000001-0000-4000-a000-000000000008', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'
),
(
    'b0000001-0000-4000-a000-000000000002', 'DL-2026-4421',
    'Major water pipe burst near Dwarka Mor Metro',
    'Drinking water has been leaking continuously from an underground main line, flooding the main corridor.',
    'Water Leakage / Shortage', 'd0000001-0000-4000-a000-000000000002', 'escalated', 'critical',
    'West Delhi', 28.6185, 77.0321,
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80',
    NULL, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'
),
(
    'b0000001-0000-4000-a000-000000000003', 'DL-2026-3091',
    'Garbage dump near primary school in Karol Bagh',
    'An unauthorized trash dumping spot has developed directly adjacent to the MCD Primary School, creating severe hygienic risks.',
    'Garbage / Waste Pile', 'd0000001-0000-4000-a000-000000000003', 'resolved', 'medium',
    'Central Delhi', 28.6445, 77.1912,
    'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    'a0000001-0000-4000-a000-000000000008', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
),
(
    'b0000001-0000-4000-a000-000000000004', 'DL-2026-7788',
    'Frequent voltage fluctuations & cable spark in Okhla Phase 3',
    'Transformer overhead lines spark during peak hours, shutting down office blocks.',
    'Streetlight / Power Outage', 'd0000001-0000-4000-a000-000000000004', 'in_progress', 'high',
    'South Delhi', 28.5355, 77.2652,
    NULL, 'a0000001-0000-4000-a000-000000000008', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'
),
(
    'b0000001-0000-4000-a000-000000000005', 'DL-2026-1211',
    'Lack of policing & lighting in Connaught Place outer circle',
    'Multiple streetlights are broken. Anti-social elements gather after dark, making it unsafe for pedestrians.',
    'Public Nuisance / Safety', 'd0000001-0000-4000-a000-000000000005', 'pending', 'medium',
    'New Delhi', 28.6304, 77.2177,
    NULL, 'a0000001-0000-4000-a000-000000000008', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'
);

-- Update resolved complaint with proof photo
UPDATE public.complaints
SET photo_after = 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=600&q=80',
    resolution_notes = 'Area cleared of all debris, bleaching powder applied, and warning banners installed.',
    resolved_at = NOW() - INTERVAL '1 day'
WHERE id = 'b0000001-0000-4000-a000-000000000003';

-- Assign officers to seed complaints
UPDATE public.complaints c
SET assigned_officer_id = o.id
FROM public.officers o
JOIN public.users u ON o.user_id = u.id
WHERE c.id = 'b0000001-0000-4000-a000-000000000001' AND u.email = 'pwd.officer@delhi.gov.in';

UPDATE public.complaints c
SET assigned_officer_id = o.id
FROM public.officers o
JOIN public.users u ON o.user_id = u.id
WHERE c.id = 'b0000001-0000-4000-a000-000000000002' AND u.email = 'djb.officer@delhi.gov.in';

UPDATE public.complaints c
SET assigned_officer_id = o.id
FROM public.officers o
JOIN public.users u ON o.user_id = u.id
WHERE c.id = 'b0000001-0000-4000-a000-000000000003' AND u.email = 'mcd.officer@delhi.gov.in';

UPDATE public.complaints c
SET assigned_officer_id = o.id
FROM public.officers o
JOIN public.users u ON o.user_id = u.id
WHERE c.id = 'b0000001-0000-4000-a000-000000000004' AND u.email = 'discom.officer@delhi.gov.in';

-- ------------------------------------------------------------------
-- 16. SEED DATA: COMPLAINT TIMELINES
-- ------------------------------------------------------------------
INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name) VALUES
('b0000001-0000-4000-a000-000000000001', 'pending', 'Grievance submitted in district: South East Delhi', 'Citizen Portal'),
('b0000001-0000-4000-a000-000000000001', 'assigned', 'Auto-assigned to S.K. Sharma (EE, PWD) (lowest active workload).', 'System Auto-Router'),
('b0000001-0000-4000-a000-000000000002', 'pending', 'Grievance submitted in district: West Delhi', 'Citizen Portal'),
('b0000001-0000-4000-a000-000000000002', 'assigned', 'Auto-assigned to Meena Das (AE, DJB) (lowest active workload).', 'System Auto-Router'),
('b0000001-0000-4000-a000-000000000002', 'escalated', 'Complaint auto-escalated to CM Cell. Resolution threshold (7 days) breached.', 'System Monitor'),
('b0000001-0000-4000-a000-000000000003', 'pending', 'Grievance submitted in district: Central Delhi', 'Citizen Portal'),
('b0000001-0000-4000-a000-000000000003', 'assigned', 'Auto-assigned to Rakesh Yadav (SI, MCD) (lowest active workload).', 'System Auto-Router'),
('b0000001-0000-4000-a000-000000000003', 'resolved', 'Debris removed and sanitation warning boards erected.', 'Rakesh Yadav (SI, MCD)'),
('b0000001-0000-4000-a000-000000000004', 'pending', 'Grievance submitted in district: South Delhi', 'Citizen Portal'),
('b0000001-0000-4000-a000-000000000004', 'assigned', 'Auto-assigned to Anil Gupta (SE, DISCOM) (lowest active workload).', 'System Auto-Router'),
('b0000001-0000-4000-a000-000000000004', 'in_progress', 'Investigation started. Ground personnel dispatched.', 'Anil Gupta (SE, DISCOM)');

-- ------------------------------------------------------------------
-- 17. SEED DATA: VISIT LOGS
-- ------------------------------------------------------------------
INSERT INTO public.visit_logs (district, visit_date, purpose, notes, complaint_count_at_visit) VALUES
('West Delhi', CURRENT_DATE - INTERVAL '10 days', 'Sub-division hospital review & drainage inspection', 'Reviewed 15 complaints, ordered immediate action on water logging near metro.', 15),
('Central Delhi', CURRENT_DATE - INTERVAL '5 days', 'Karol Bagh market vendor grievance session', 'Addressed garbage cleanup delay. Placed MCD agency on 24-hr notice.', 8);

-- ====================================================================
-- SETUP COMPLETE
-- ====================================================================
SELECT 'NeonDB setup complete' AS status;
