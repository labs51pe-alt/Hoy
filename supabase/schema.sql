-- ============================================================================
-- HOY APP & CRM ADMINISTRATIVO (PEN / SOLES PERUANOS) - SCHEMA COMPLETO SUPABASE
-- ============================================================================

-- 0. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función reutilizable para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. CATÁLOGO DE PLANES Y PRECIOS (EN SOLES S/)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.membership_plans (
  code TEXT PRIMARY KEY CHECK (code IN ('Vitalicio', 'Trimestral', 'Mensual')),
  display_name TEXT NOT NULL,
  price_pen NUMERIC(10, 2) NOT NULL CHECK (price_pen >= 0),
  duration_days INTEGER, -- NULL = acceso vitalicio sin vencimiento
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.membership_plans (code, display_name, price_pen, duration_days)
VALUES
  ('Vitalicio', 'Plan Vitalicio', 75.00, NULL),
  ('Trimestral', 'Plan Trimestral', 55.00, 90),
  ('Mensual', 'Plan Mensual', 25.00, 30)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. PERFILES DE USUARIOS / CLIENTES CRM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT '+51',
  phone_local TEXT NOT NULL,
  phone_e164 TEXT NOT NULL UNIQUE, -- Formato sin espacios: ej. '+51999888777'
  city TEXT NOT NULL DEFAULT 'No especificada',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- Estado de membresía y datos comerciales del CRM
  status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'activo', 'pausado', 'vencido')),
  plan TEXT NOT NULL DEFAULT 'Vitalicio'
    REFERENCES public.membership_plans(code) ON UPDATE CASCADE,
  amount_pen NUMERIC(10, 2) NOT NULL DEFAULT 75.00 CHECK (amount_pen >= 0),
  payment_method TEXT NOT NULL DEFAULT 'Por definir'
    CHECK (payment_method IN ('Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Efectivo', 'Por definir')),
  payment_status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (payment_status IN ('pendiente', 'pagado', 'reembolsado')),
  payment_ref TEXT DEFAULT '',
  notes TEXT DEFAULT '',

  -- Control de acceso y regla de 7 días para OTP
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_otp_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_e164);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created ON public.profiles(created_at DESC);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. AUTENTICACIÓN WHATSAPP OTP Y SESIONES (REGLA DE 7 DÍAS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  code_hash TEXT NOT NULL, -- Hash SHA-256 del código de 6 dígitos
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_active
  ON public.otp_codes(phone_e164, created_at DESC)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  device_label TEXT DEFAULT '',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_profile ON public.user_sessions(profile_id);

-- ============================================================================
-- 4. HISTORIAL DE PAGOS / LIBRO CONTABLE CRM (S/)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL REFERENCES public.membership_plans(code) ON UPDATE CASCADE,
  amount_pen NUMERIC(10, 2) NOT NULL CHECK (amount_pen >= 0),
  method TEXT NOT NULL
    CHECK (method IN ('Yape', 'Plin', 'Transferencia', 'Tarjeta', 'Efectivo', 'Por definir')),
  status TEXT NOT NULL DEFAULT 'confirmado'
    CHECK (status IN ('confirmado', 'pendiente', 'reembolsado')),
  reference_code TEXT DEFAULT '',
  note TEXT DEFAULT '',
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_profile ON public.payments(profile_id);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at ON public.payments(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ============================================================================
-- 5. LOGS DE ENVÍOS WHATSAPP (N8N + EVOLUTION API)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  phone_e164 TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('instrucciones_pago', 'aprobacion_bienvenida', 'otp_login', 'recordatorio_pago')),
  message_preview TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (delivery_status IN ('pendiente', 'enviado', 'error')),
  n8n_execution_id TEXT DEFAULT '',
  error_detail TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_profile ON public.whatsapp_logs(profile_id, created_at DESC);

-- ============================================================================
-- 6. PREFERENCIAS Y CONFIGURACIÓN DE ALERTAS DE CADA USUARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  same_sunday_routine BOOLEAN NOT NULL DEFAULT true,
  active_routine_mode TEXT NOT NULL DEFAULT 'semana' CHECK (active_routine_mode IN ('semana', 'domingo')),
  alerts_enabled BOOLEAN NOT NULL DEFAULT false,
  alerts_sound BOOLEAN NOT NULL DEFAULT true,
  evening_review_enabled BOOLEAN NOT NULL DEFAULT true,
  evening_review_time TEXT NOT NULL DEFAULT '21:00',
  morning_prompted_date DATE,
  evening_prompted_date DATE,
  applied_plan_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trg_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 7. RUTINAS DIARIAS (SEMANA Y DOMINGO)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  routine_type TEXT NOT NULL CHECK (routine_type IN ('semana', 'domingo')),
  title TEXT NOT NULL,
  scheduled_time TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routines_profile_type
  ON public.routines(profile_id, routine_type, sort_order);

-- ============================================================================
-- 8. PROYECTOS Y TAREAS CON HORARIO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  step_note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'ideas'
    CHECK (status IN ('ideas', 'haciendo', 'esperando', 'terminado')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_profile_status
  ON public.projects(profile_id, status);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  scheduled_time TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_tasks_project
  ON public.project_tasks(project_id, sort_order);

-- ============================================================================
-- 9. PROGRESO DIARIO, RACHAS, ALERTAS Y PLANIFICACIÓN NOCTURNA
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_routine_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  day_marked_for_streak BOOLEAN NOT NULL DEFAULT false,
  alerts_fired JSONB NOT NULL DEFAULT '[]'::jsonb,
  snoozed_until JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_streak
  ON public.daily_checkins(profile_id, check_date DESC)
  WHERE day_marked_for_streak = true;

DROP TRIGGER IF EXISTS trg_daily_checkins_updated_at ON public.daily_checkins;
CREATE TRIGGER trg_daily_checkins_updated_at
  BEFORE UPDATE ON public.daily_checkins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.planned_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_date DATE NOT NULL,
  routine_type TEXT CHECK (routine_type IN ('semana', 'domingo')),
  active_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  priority_task TEXT DEFAULT '',
  priority_time TEXT DEFAULT '',
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (profile_id, target_date)
);

-- ============================================================================
-- 10. TABLA SNAPSHOT COMPATIBLE CON EL CLIENTE ACTUAL
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.progreso (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_progreso_updated_at ON public.progreso;
CREATE TRIGGER trg_progreso_updated_at
  BEFORE UPDATE ON public.progreso
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 11. VISTAS ANALÍTICAS PARA EL PANEL CRM (EN SOLES S/)
-- ============================================================================
CREATE OR REPLACE VIEW public.crm_kpi_summary AS
SELECT
  COUNT(*)::INT AS total_clients,
  COUNT(*) FILTER (WHERE status = 'activo')::INT AS active_clients,
  COUNT(*) FILTER (WHERE status = 'pendiente')::INT AS pending_clients,
  COUNT(*) FILTER (WHERE status = 'pausado')::INT AS paused_clients,
  COUNT(*) FILTER (WHERE status = 'vencido')::INT AS expired_clients,
  COALESCE((SELECT SUM(amount_pen) FROM public.payments WHERE status = 'confirmado'), 0)::NUMERIC(10,2) AS total_earnings_pen,
  COALESCE((
    SELECT SUM(amount_pen)
    FROM public.payments
    WHERE status = 'confirmado'
      AND date_trunc('month', paid_at) = date_trunc('month', CURRENT_DATE)
  ), 0)::NUMERIC(10,2) AS month_earnings_pen,
  COALESCE(SUM(amount_pen) FILTER (WHERE status = 'pendiente' AND payment_status = 'pendiente'), 0)::NUMERIC(10,2) AS pending_receivables_pen,
  COALESCE((SELECT AVG(amount_pen) FROM public.payments WHERE status = 'confirmado'), 0)::NUMERIC(10,2) AS avg_ticket_pen
FROM public.profiles;

CREATE OR REPLACE VIEW public.crm_daily_revenue AS
SELECT
  paid_at AS day,
  COUNT(*)::INT AS payments_count,
  COALESCE(SUM(amount_pen), 0)::NUMERIC(10,2) AS revenue_pen
FROM public.payments
WHERE status = 'confirmado'
GROUP BY paid_at
ORDER BY paid_at DESC;

-- ============================================================================
-- 12. SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progreso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Planes visibles publicamente" ON public.membership_plans;
CREATE POLICY "Planes visibles publicamente"
  ON public.membership_plans FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Usuario ve su propio perfil" ON public.profiles;
CREATE POLICY "Usuario ve su propio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Usuario edita sus preferencias" ON public.user_preferences;
CREATE POLICY "Usuario edita sus preferencias"
  ON public.user_preferences FOR ALL
  USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario gestiona sus rutinas" ON public.routines;
CREATE POLICY "Usuario gestiona sus rutinas"
  ON public.routines FOR ALL
  USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario gestiona sus proyectos" ON public.projects;
CREATE POLICY "Usuario gestiona sus proyectos"
  ON public.projects FOR ALL
  USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario gestiona sus tareas" ON public.project_tasks;
CREATE POLICY "Usuario gestiona sus tareas"
  ON public.project_tasks FOR ALL
  USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario gestiona sus checkins" ON public.daily_checkins;
CREATE POLICY "Usuario gestiona sus checkins"
  ON public.daily_checkins FOR ALL
  USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario gestiona sus dias planeados" ON public.planned_days;
CREATE POLICY "Usuario gestiona sus dias planeados"
  ON public.planned_days FOR ALL
  USING (profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Usuario gestiona su progreso snapshot" ON public.progreso;
CREATE POLICY "Usuario gestiona su progreso snapshot"
  ON public.progreso FOR ALL
  USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));
