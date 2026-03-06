-- ============================================================
-- MandıraM - Supabase SQL Migration
-- Version: 1.0.0 (Phase 1 - Record Management)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'breeder', 'viewer');
CREATE TYPE animal_species AS ENUM ('buyukbas', 'kucukbas');
CREATE TYPE animal_gender AS ENUM ('erkek', 'disi');
CREATE TYPE animal_status AS ENUM ('active', 'reserved', 'sold', 'slaughtered', 'archived');
CREATE TYPE media_type AS ENUM ('photo', 'video');
CREATE TYPE media_view_label AS ENUM ('front', 'side', 'teeth', 'tail', 'body', 'other');

-- ============================================================
-- USERS TABLE
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'breeder',
  city TEXT,
  district TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANIMALS TABLE
-- ============================================================

CREATE TABLE animals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_code TEXT UNIQUE NOT NULL, -- MND-2024-XXXXX (system generated)
  ear_tag_no TEXT NOT NULL,          -- Küpe No
  chip_no TEXT,                      -- optional
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species animal_species NOT NULL,
  breed TEXT NOT NULL,               -- Irk
  gender animal_gender NOT NULL,
  birth_date DATE NOT NULL,
  weight_kg DECIMAL(6,2),
  est_slaughter_weight DECIMAL(6,2), -- optional
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  status animal_status NOT NULL DEFAULT 'active',
  health_notes TEXT,
  vaccination_notes TEXT,
  qr_code_url TEXT,
  cover_photo_url TEXT,              -- first/main photo for listing cards
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate animal_code trigger
CREATE OR REPLACE FUNCTION generate_animal_code()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  seq_part TEXT;
  new_code TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  seq_part := LPAD(NEXTVAL('animal_code_seq')::TEXT, 5, '0');
  new_code := 'MND-' || year_part || '-' || seq_part;
  NEW.animal_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS animal_code_seq START 1;

CREATE TRIGGER set_animal_code
  BEFORE INSERT ON animals
  FOR EACH ROW
  WHEN (NEW.animal_code IS NULL OR NEW.animal_code = '')
  EXECUTE FUNCTION generate_animal_code();

-- ============================================================
-- ANIMAL MEDIA TABLE
-- ============================================================

CREATE TABLE animal_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,        -- Supabase storage path
  media_type media_type NOT NULL DEFAULT 'photo',
  view_label media_view_label NOT NULL DEFAULT 'other',
  order_index INT NOT NULL DEFAULT 0,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANIMAL LOGS TABLE (audit trail)
-- ============================================================

CREATE TABLE animal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES users(id),
  action TEXT NOT NULL,              -- 'created', 'status_changed', 'weight_updated', etc.
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHASE 2 PRE-SCHEMA: LISTINGS (disabled until Phase 2)
-- ============================================================

CREATE TABLE animal_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID UNIQUE NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  price DECIMAL(10,2),
  whatsapp_number TEXT,
  contact_phone TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  listed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHASE 3 PRE-SCHEMA: KURBAN GROUPS (disabled until Phase 3)
-- ============================================================

CREATE TABLE kurban_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  total_price DECIMAL(10,2) NOT NULL,
  max_partners INT NOT NULL DEFAULT 7,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'open', -- open, full, confirmed, cancelled
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kurban_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES kurban_groups(id) ON DELETE CASCADE,
  partner_name TEXT NOT NULL,
  phone TEXT,
  share_price DECIMAL(10,2),
  is_confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_animals_owner ON animals(owner_id);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_species ON animals(species);
CREATE INDEX idx_animals_city ON animals(city);
CREATE INDEX idx_animals_ear_tag ON animals(ear_tag_no);
CREATE INDEX idx_animals_code ON animals(animal_code);
CREATE INDEX idx_animal_media_animal ON animal_media(animal_id);
CREATE INDEX idx_animal_logs_animal ON animal_logs(animal_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER animals_updated_at
  BEFORE UPDATE ON animals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_listings ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: get current user's id
CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- USERS POLICIES
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth_id = auth.uid() OR get_my_role() = 'admin');

CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (auth_id = auth.uid());

-- ANIMALS POLICIES
CREATE POLICY "animals_breeder_own" ON animals
  FOR ALL USING (
    owner_id = get_my_user_id() OR get_my_role() = 'admin'
  );

CREATE POLICY "animals_public_read_active" ON animals
  FOR SELECT USING (status = 'active');

-- ANIMAL MEDIA POLICIES
CREATE POLICY "media_owner_or_admin" ON animal_media
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM animals a
      WHERE a.id = animal_media.animal_id
      AND (a.owner_id = get_my_user_id() OR get_my_role() = 'admin')
    )
  );

-- ANIMAL LOGS POLICIES
CREATE POLICY "logs_owner_or_admin" ON animal_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM animals a
      WHERE a.id = animal_logs.animal_id
      AND (a.owner_id = get_my_user_id() OR get_my_role() = 'admin')
    )
  );

-- LISTINGS POLICIES
CREATE POLICY "listings_owner_or_admin" ON animal_listings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM animals a
      WHERE a.id = animal_listings.animal_id
      AND (a.owner_id = get_my_user_id() OR get_my_role() = 'admin')
    )
  );

CREATE POLICY "listings_public_read" ON animal_listings
  FOR SELECT USING (is_public = true);

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- ============================================================
-- Create bucket: animal-media
--   Public: false
--   File size limit: 10MB
--   Allowed types: image/jpeg, image/png, image/webp, video/mp4

-- ============================================================
-- SEED DATA: Demo Admin User (update auth_id after auth setup)
-- ============================================================

-- INSERT INTO users (auth_id, email, full_name, role)
-- VALUES ('YOUR-AUTH-UUID', 'admin@mandiram.com', 'MandıraM Admin', 'admin');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Breeder stats view
CREATE OR REPLACE VIEW breeder_stats AS
SELECT
  u.id AS breeder_id,
  u.full_name,
  u.city,
  COUNT(a.id) AS total_animals,
  COUNT(a.id) FILTER (WHERE a.status = 'active') AS active_count,
  COUNT(a.id) FILTER (WHERE a.status = 'reserved') AS reserved_count,
  COUNT(a.id) FILTER (WHERE a.status = 'sold') AS sold_count,
  COUNT(a.id) FILTER (WHERE a.status = 'archived') AS archived_count,
  AVG(a.weight_kg) FILTER (WHERE a.status = 'active') AS avg_weight_kg
FROM users u
LEFT JOIN animals a ON a.owner_id = u.id
WHERE u.role = 'breeder'
GROUP BY u.id, u.full_name, u.city;

-- Animal full view (with owner info and media count)
CREATE OR REPLACE VIEW animals_full AS
SELECT
  a.*,
  u.full_name AS owner_name,
  u.phone AS owner_phone,
  u.city AS owner_city,
  DATE_PART('year', AGE(a.birth_date)) * 12 + DATE_PART('month', AGE(a.birth_date)) AS age_months,
  DATE_PART('year', AGE(a.birth_date)) AS age_years,
  (SELECT COUNT(*) FROM animal_media m WHERE m.animal_id = a.id) AS media_count
FROM animals a
JOIN users u ON u.id = a.owner_id;
