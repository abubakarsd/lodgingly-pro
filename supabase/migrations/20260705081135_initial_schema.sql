
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('student', 'admin');
CREATE TYPE public.allocation_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.clearance_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.hostel_gender AS ENUM ('male', 'female', 'mixed');

-- ============ updated_at helper ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  matric_number TEXT UNIQUE,
  phone TEXT,
  program TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- ============ HOSTELS / BLOCKS / ROOMS ============
CREATE TABLE public.hostels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campus TEXT,
  gender hostel_gender NOT NULL DEFAULT 'mixed',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hostels TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.hostels TO authenticated;
GRANT ALL ON public.hostels TO service_role;
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floors INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blocks TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.blocks TO authenticated;
GRANT ALL ON public.blocks TO service_role;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  room_type TEXT NOT NULL DEFAULT 'Shared',
  price_per_term NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(block_id, room_number)
);
GRANT SELECT ON public.rooms TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- ============ ALLOCATIONS ============
CREATE TABLE public.allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  bed_label TEXT NOT NULL,
  term TEXT NOT NULL,
  status allocation_status NOT NULL DEFAULT 'active',
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX allocations_unique_active_bed
  ON public.allocations(room_id, bed_label) WHERE status = 'active';
CREATE UNIQUE INDEX allocations_one_active_per_student
  ON public.allocations(student_id) WHERE status = 'active';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allocations TO authenticated;
GRANT ALL ON public.allocations TO service_role;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;

-- ============ COMPLAINTS ============
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  priority complaint_priority NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_complaints_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ MESSAGES ============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============ CLEARANCE ============
CREATE TABLE public.clearance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  status clearance_status NOT NULL DEFAULT 'pending',
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clearance_items TO authenticated;
GRANT ALL ON public.clearance_items TO service_role;
ALTER TABLE public.clearance_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clearance_updated BEFORE UPDATE ON public.clearance_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ RLS POLICIES ============
-- profiles
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- hostels / blocks / rooms: readable by anyone signed in or anon; admin writes
CREATE POLICY "Hostels readable" ON public.hostels FOR SELECT USING (true);
CREATE POLICY "Admins manage hostels" ON public.hostels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Blocks readable" ON public.blocks FOR SELECT USING (true);
CREATE POLICY "Admins manage blocks" ON public.blocks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Rooms readable" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Admins manage rooms" ON public.rooms FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- allocations
CREATE POLICY "Students view own allocations" ON public.allocations FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students create own allocation" ON public.allocations FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students cancel own allocation" ON public.allocations FOR UPDATE TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete allocations" ON public.allocations FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- complaints
CREATE POLICY "Students view own complaints" ON public.complaints FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students create complaints" ON public.complaints FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students update own complaints" ON public.complaints FOR UPDATE TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete complaints" ON public.complaints FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- messages: only users allocated to that room (active)
CREATE POLICY "Roommates read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.allocations a WHERE a.room_id = messages.room_id AND a.student_id = auth.uid() AND a.status = 'active')
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Roommates send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.allocations a WHERE a.room_id = messages.room_id AND a.student_id = auth.uid() AND a.status = 'active')
);

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System/Admin insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete notifications" ON public.notifications FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- clearance
CREATE POLICY "Students view own clearance" ON public.clearance_items FOR SELECT TO authenticated USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Students insert own clearance" ON public.clearance_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Admins update clearance" ON public.clearance_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ AUTO-CREATE profile + default role on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ REALTIME ============
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.allocations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.allocations;

-- ============ SEED DATA ============
INSERT INTO public.hostels (name, description, campus, gender) VALUES
  ('Emerald Hall', 'Modern residence with study lounges and gym access.', 'North Campus', 'mixed'),
  ('Verdant Wing', 'Quiet residence close to the library.', 'South Campus', 'female'),
  ('Cedar Commons', 'Community-focused living with shared kitchens.', 'Central Campus', 'male'),
  ('Ivy Pavilion', 'Premium en-suite rooms with courtyard views.', 'West Campus', 'mixed');

-- Add one block + a few rooms per hostel
DO $$
DECLARE h RECORD; b UUID; i INT;
BEGIN
  FOR h IN SELECT id, name FROM public.hostels LOOP
    INSERT INTO public.blocks (hostel_id, name, floors) VALUES (h.id, 'Block A', 4) RETURNING id INTO b;
    FOR i IN 1..8 LOOP
      INSERT INTO public.rooms (block_id, room_number, capacity, room_type, price_per_term)
      VALUES (b, (100 + i)::text, 2, 'Shared Ensuite', 1200);
    END LOOP;
  END LOOP;
END $$;
