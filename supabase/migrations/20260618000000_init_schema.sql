-- Create custom roles and tables for Delhi CM Grievance Redressal Dashboard

-- Enable PostGIS extension for coordinates if available
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    active_officers_count INT DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- references auth.users(id)
    role VARCHAR(50) NOT NULL CHECK (role IN ('cm', 'admin', 'officer', 'citizen')),
    phone VARCHAR(20),
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    district VARCHAR(100),
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Officers Table
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    workload_count INT DEFAULT 0,
    max_workload INT DEFAULT 15,
    is_active BOOLEAN DEFAULT true,
    avg_rating DECIMAL(3,2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Complaints Table
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_no VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    department_id UUID NOT NULL REFERENCES public.departments(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved', 'reopened', 'escalated')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    district VARCHAR(100) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    photo_before TEXT,
    photo_after TEXT,
    citizen_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Complaint Timeline Table
CREATE TABLE IF NOT EXISTS public.complaint_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    action_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action_by_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CM Visit Logs Table
CREATE TABLE IF NOT EXISTS public.visit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    district VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    complaint_count_at_visit INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Re-Inspections Table
CREATE TABLE IF NOT EXISTS public.re_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    assigned_inspector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------
-- TRIGGERS AND CORE PROCEDURAL FUNCTIONS
-- ------------------------------------------------------------------

-- A. Auto assignment trigger function
-- Assigns a newly inserted complaint to the active officer in that department with the lowest workload count.
CREATE OR REPLACE FUNCTION public.route_complaint_assignment()
RETURNS TRIGGER AS $$
DECLARE
    target_officer_id UUID;
BEGIN
    -- Find officer with minimum workload count in the designated department
    SELECT id INTO target_officer_id
    FROM public.officers
    WHERE department_id = NEW.department_id AND is_active = true
    ORDER BY workload_count ASC, created_at ASC
    LIMIT 1;

    IF target_officer_id IS NOT NULL THEN
        NEW.assigned_officer_id := target_officer_id;
        NEW.status := 'assigned';
        
        -- Increment officer workload
        UPDATE public.officers 
        SET workload_count = workload_count + 1 
        WHERE id = target_officer_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_route_complaint_assignment
BEFORE INSERT ON public.complaints
FOR EACH ROW
WHEN (NEW.assigned_officer_id IS NULL)
EXECUTE FUNCTION public.route_complaint_assignment();


-- B. Timeline logging trigger
CREATE OR REPLACE FUNCTION public.log_complaint_timeline_event()
RETURNS TRIGGER AS $$
DECLARE
    editor_name VARCHAR(255) := 'System Auto-Router';
BEGIN
    -- Capture timeline history records on status changes
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (NEW.id, NEW.status, 'Grievance submitted in district: ' || NEW.district, 'Citizen Portal');
    ELSIF OLD.status <> NEW.status OR OLD.assigned_officer_id IS DISTINCT FROM NEW.assigned_officer_id THEN
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (
            NEW.id, 
            NEW.status, 
            'Complaint updated. Status: ' || NEW.status || COALESCE('. Officer reassigned.', '.'),
            'Department/Admin'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_log_complaint_timeline
AFTER INSERT OR UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.log_complaint_timeline_event();


-- C. Decrement workload upon resolution
CREATE OR REPLACE FUNCTION public.adjust_officer_workload()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IN ('assigned', 'in_progress') AND NEW.status = 'resolved' THEN
        UPDATE public.officers
        SET workload_count = GREATEST(0, workload_count - 1)
        WHERE id = NEW.assigned_officer_id;
        
        -- Trigger random 10% re-inspection selection
        IF random() < 0.10 THEN
            INSERT INTO public.re_inspections (complaint_id, status)
            VALUES (NEW.id, 'pending');
            
            INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
            VALUES (NEW.id, NEW.status, 'Complaint selected for random 10% quality audit re-inspection.', 'System Audit');
        END IF;
    ELSIF OLD.status = 'resolved' AND NEW.status = 'reopened' THEN
        -- If complaint is reopened, increment workload
        UPDATE public.officers
        SET workload_count = workload_count + 1
        WHERE id = NEW.assigned_officer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_adjust_officer_workload
AFTER UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.adjust_officer_workload();


-- D. Low rating auto-reopen trigger
CREATE OR REPLACE FUNCTION public.reopen_on_low_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rating < 3 THEN
        -- Reopen complaint
        UPDATE public.complaints
        SET status = 'reopened', updated_at = now()
        WHERE id = NEW.complaint_id;

        -- Log timeline audit
        INSERT INTO public.complaint_timeline (complaint_id, status, description, action_by_name)
        VALUES (
            NEW.complaint_id, 
            'reopened', 
            'Auto-reopened due to poor citizen rating: ' || NEW.rating || '/5. Rating Comment: ' || COALESCE(NEW.comments, ''), 
            'Citizen Feedback Loop'
        );
    END IF;
    
    -- Recalculate officer ratings
    UPDATE public.officers
    SET avg_rating = (
        SELECT AVG(f.rating)::DECIMAL(3,2) 
        FROM public.feedback f
        JOIN public.complaints c ON c.id = f.complaint_id
        WHERE c.assigned_officer_id = public.officers.id
    )
    WHERE id = (SELECT assigned_officer_id FROM public.complaints WHERE id = NEW.complaint_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_reopen_on_low_rating
AFTER INSERT ON public.feedback
FOR EACH ROW
EXECUTE FUNCTION public.reopen_on_low_rating();

-- Row Level Security (RLS) Configs
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.re_inspections ENABLE ROW LEVEL SECURITY;

-- Creating public policies for select statements
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to officers" ON public.officers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to complaints" ON public.complaints FOR SELECT USING (true);
CREATE POLICY "Allow public read/write to timelines" ON public.complaint_timeline USING (true);
CREATE POLICY "Allow public read access to visit logs" ON public.visit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public read/write to feedback" ON public.feedback USING (true);
CREATE POLICY "Allow public read/write to re-inspections" ON public.re_inspections USING (true);

-- Insert Seed Data
INSERT INTO public.departments (name, code) VALUES
('Public Works Department (PWD)', 'PWD'),
('Delhi Jal Board (DJB)', 'DJB'),
('MCD Garbage & Sanitation', 'MCD'),
('Power & Electricity (DISCOMs)', 'DISCOM'),
('Delhi Police & Security', 'POLICE')
ON CONFLICT (code) DO NOTHING;
