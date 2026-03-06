-- ============================================================
-- MandıraM v1.1 — Güncellenmiş Veritabanı Şeması
-- Türkiye Hayvancılık Mevzuatına Uygun (TÜRKVET / VETBİS)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM'LAR
-- ============================================================

CREATE TYPE user_role       AS ENUM ('admin', 'breeder', 'viewer');
CREATE TYPE animal_species  AS ENUM ('buyukbas', 'kucukbas');
CREATE TYPE animal_gender   AS ENUM ('erkek', 'disi');
CREATE TYPE animal_status   AS ENUM ('active', 'reserved', 'sold', 'slaughtered', 'dead', 'lost', 'archived');
CREATE TYPE media_type      AS ENUM ('photo', 'video');
CREATE TYPE media_view_label AS ENUM ('front', 'side', 'teeth', 'tail', 'body', 'other');

-- Büyükbaş alt türleri
CREATE TYPE buyukbas_subtype AS ENUM ('sigir', 'manda', 'diger');
-- Küçükbaş alt türleri
CREATE TYPE kucukbas_subtype AS ENUM ('koyun', 'keci', 'diger');

-- Gebelik durumu
CREATE TYPE pregnancy_status AS ENUM ('gebe', 'gebe_degil', 'bilinmiyor');

-- Hareket türleri (TÜRKVET uyumlu)
CREATE TYPE movement_type AS ENUM ('giris', 'cikis', 'dogum', 'olum', 'kayip', 'kesim');

-- ============================================================
-- KULLANICILAR (BESİCİLER)
-- ============================================================

CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'breeder',

  -- İşletme bilgileri
  ikn                   TEXT,        -- İşletme Kayıt Numarası (zorunlu resmi no)
  isletme_adi           TEXT,        -- İşletme adı
  isletme_adres         TEXT,        -- İşletme adresi
  isletme_il            TEXT,
  isletme_ilce          TEXT,
  isletme_koy           TEXT,
  turkvet_kullanici_no  TEXT,        -- TÜRKVET sistemi kullanıcı no

  -- Yetiştirici örgütü
  yetistirici_birligi   TEXT,        -- Bağlı olduğu birlik
  birlik_uye_no         TEXT,        -- Birlik üye numarası

  is_active   BOOLEAN NOT NULL DEFAULT true,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HAYVANLAR — ANA TABLO
-- ============================================================

CREATE TABLE animals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_code  TEXT UNIQUE NOT NULL,   -- MND-2024-XXXXX (sistem kodu)
  owner_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- ── KİMLİK BİLGİLERİ ─────────────────────────────────────
  ear_tag_no          TEXT NOT NULL,   -- Küpe No (TR-XX-YYYY-XXXXXX formatı)
  ear_tag_no_2        TEXT,            -- 2. küpe (bazı hayvanlar çift küpeli)
  chip_no             TEXT,            -- Mikroçip No (15 haneli ISO 11784/11785)
  turkvet_no          TEXT,            -- TÜRKVET kayıt numarası
  pasaport_no         TEXT,            -- Hayvan pasaportu / soy kütüğü no
  ikn                 TEXT,            -- Doğduğu işletmenin IKN'si

  -- ── TÜR & IRK ─────────────────────────────────────────────
  species             animal_species NOT NULL,
  buyukbas_subtype    buyukbas_subtype,  -- sığır / manda
  kucukbas_subtype    kucukbas_subtype,  -- koyun / keçi
  breed               TEXT NOT NULL,     -- Irk
  is_crossbreed       BOOLEAN DEFAULT false,  -- Melez mi?
  crossbreed_detail   TEXT,              -- Melez ise detay (örn: %50 Simental %50 Holstein)
  coat_color          TEXT,              -- Renk / desen
  distinctive_marks   TEXT,             -- Ayırt edici işaretler

  -- ── CİNSİYET & ÜREME ──────────────────────────────────────
  gender              animal_gender NOT NULL,
  is_castrated        BOOLEAN DEFAULT false,   -- İğdiş / kısırlaştırılmış mı?
  pregnancy_status    pregnancy_status DEFAULT 'bilinmiyor',
  last_birth_date     DATE,                    -- Son doğum tarihi
  total_births        INT DEFAULT 0,           -- Toplam doğum sayısı
  total_offspring     INT DEFAULT 0,           -- Toplam yavru sayısı

  -- ── SOYAĞI ────────────────────────────────────────────────
  anne_kupe_no        TEXT,            -- Anne küpe no
  baba_kupe_no        TEXT,            -- Baba küpe no (damızlık)
  anne_irkı           TEXT,            -- Anne ırkı
  baba_irkı           TEXT,            -- Baba ırkı
  soy_kutugu_sinifi   TEXT,            -- A / B / C (TÜRKVET soy kütüğü sınıfı)
  genomik_test        BOOLEAN DEFAULT false,  -- Genomik test yapıldı mı?
  genomik_test_tarihi DATE,

  -- ── DOĞUM & YAŞ ───────────────────────────────────────────
  birth_date          DATE NOT NULL,
  birth_place_ikn     TEXT,            -- Doğduğu işletmenin IKN'si
  birth_type          TEXT,            -- Tekil / İkiz / Üçüz

  -- ── FİZİKSEL ──────────────────────────────────────────────
  weight_kg           DECIMAL(6,2),   -- Canlı ağırlık (kg)
  est_slaughter_weight DECIMAL(6,2),  -- Tahmini kesim ağırlığı
  height_cm           DECIMAL(5,1),   -- Boy / withers height (cm)
  body_score          DECIMAL(3,1),   -- Vücut kondisyon skoru (1-5)

  -- ── SÜRT VERİMİ (dişi büyükbaş için) ─────────────────────
  avg_daily_milk_lt   DECIMAL(5,2),   -- Ortalama günlük süt verimi (lt)
  lactation_count     INT DEFAULT 0,  -- Toplam laktasyon sayısı

  -- ── BESİ TAKİBİ ───────────────────────────────────────────
  besi_baslangic_tarihi  DATE,        -- Besiye girdi tarihi
  besi_baslangic_kg      DECIMAL(6,2), -- Besiye giriş ağırlığı
  hedef_kesim_tarihi     DATE,        -- Hedeflenen kesim tarihi

  -- ── KONUM ─────────────────────────────────────────────────
  city                TEXT NOT NULL,
  district            TEXT NOT NULL,
  neighborhood        TEXT,           -- Köy / mahalle

  -- ── DURUM & YÖNETİM ───────────────────────────────────────
  status              animal_status NOT NULL DEFAULT 'active',
  status_date         DATE,           -- Son durum değişikliği tarihi
  status_notes        TEXT,           -- Durum notları (satış/kesim detayı)

  -- ── GENEL NOTLAR ──────────────────────────────────────────
  health_notes        TEXT,           -- Genel sağlık notları
  feed_notes          TEXT,           -- Yem / beslenme notları
  general_notes       TEXT,           -- Diğer notlar

  -- ── SİSTEM ────────────────────────────────────────────────
  qr_code_url         TEXT,
  cover_photo_url     TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS animal_code_seq START 1;

CREATE OR REPLACE FUNCTION generate_animal_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.animal_code := 'MND-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('animal_code_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_animal_code
  BEFORE INSERT ON animals
  FOR EACH ROW
  WHEN (NEW.animal_code IS NULL OR NEW.animal_code = '')
  EXECUTE FUNCTION generate_animal_code();

-- ============================================================
-- AŞI TAKVİMİ
-- ============================================================

CREATE TABLE vaccinations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id       UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  vaccine_name    TEXT NOT NULL,      -- Aşı adı (Şap, Brucella, vb.)
  vaccine_type    TEXT,               -- Aşı türü / üretici
  batch_no        TEXT,               -- Parti / seri numarası
  applied_date    DATE NOT NULL,      -- Uygulandığı tarih
  applied_by      TEXT,               -- Uygulayan veteriner / kurum
  next_due_date   DATE,               -- Sonraki aşı tarihi
  is_government   BOOLEAN DEFAULT false,  -- Devlet programlı aşı mı?
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VETERİNER MUAYENE GEÇMİŞİ
-- ============================================================

CREATE TABLE vet_examinations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id       UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  exam_date       DATE NOT NULL,
  vet_name        TEXT,               -- Veteriner adı
  vet_clinic      TEXT,               -- Klinik / kurum
  exam_type       TEXT NOT NULL,      -- Rutin / Acil / Kontrol / Hastalık
  diagnosis       TEXT,               -- Tanı
  treatment       TEXT,               -- Tedavi
  prescription    TEXT,               -- Reçete
  follow_up_date  DATE,               -- Kontrol tarihi
  exam_fee        DECIMAL(8,2),       -- Muayene ücreti
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HASTALIK & TEDAVİ GEÇMİŞİ
-- ============================================================

CREATE TABLE health_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id       UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  record_date     DATE NOT NULL,
  disease_name    TEXT NOT NULL,      -- Hastalık adı
  symptoms        TEXT,               -- Belirtiler
  diagnosis       TEXT,               -- Tanı
  treatment_start DATE,
  treatment_end   DATE,
  outcome         TEXT,               -- İyileşti / Kronik / Öldü
  vet_name        TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- İLAÇ UYGULAMA GEÇMİŞİ
-- ============================================================

CREATE TABLE medications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id       UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  applied_date    DATE NOT NULL,
  drug_name       TEXT NOT NULL,      -- İlaç adı
  drug_type       TEXT,               -- Antibiyotik / Parazit / Vitamin vb.
  dose            TEXT,               -- Doz miktarı
  route           TEXT,               -- Uygulama yolu (IM/IV/Oral vb.)
  withdrawal_days INT,                -- Et/süt bekleme süresi (gün)
  withdrawal_end  DATE,               -- Bekleme süresi bitiş tarihi
  applied_by      TEXT,               -- Uygulayan
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GEBELİK & DOĞUM KAYITLARI
-- ============================================================

CREATE TABLE reproduction_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id         UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  record_type       TEXT NOT NULL,    -- 'tohumlama' / 'gebelik_tespiti' / 'dogum' / 'atik'
  record_date       DATE NOT NULL,

  -- Tohumlama
  insemination_type TEXT,             -- Suni / Tabii
  bull_ear_tag      TEXT,             -- Boğa küpe no (tabii çiftleşmede)
  semen_batch       TEXT,             -- Semen parti no (suni tohumlamada)

  -- Gebelik
  pregnancy_confirmed BOOLEAN,
  expected_birth_date DATE,

  -- Doğum
  birth_date        DATE,
  offspring_count   INT,              -- Kaç yavru doğdu
  offspring_gender  TEXT,             -- erkek/dişi/karışık
  birth_difficulty  TEXT,             -- Normal / Güç doğum / Sezaryen
  offspring_tags    TEXT,             -- Yavruların küpe noları

  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SÜT VERİMİ KAYITLARI
-- ============================================================

CREATE TABLE milk_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id       UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  record_date     DATE NOT NULL,
  lactation_no    INT,                -- Kaçıncı laktasyon
  morning_lt      DECIMAL(5,2),       -- Sabah sütü (lt)
  evening_lt      DECIMAL(5,2),       -- Akşam sütü (lt)
  total_lt        DECIMAL(5,2),       -- Günlük toplam (lt)
  fat_percent     DECIMAL(4,2),       -- Yağ oranı (%)
  protein_percent DECIMAL(4,2),       -- Protein oranı (%)
  somatic_count   INT,                -- Somatik hücre sayısı
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HAYVAN HAREKETLERİ (TÜRKVET UYUMLU)
-- ============================================================

CREATE TABLE animal_movements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id         UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  movement_type     movement_type NOT NULL,
  movement_date     DATE NOT NULL,
  from_ikn          TEXT,             -- Kaynak işletme IKN
  to_ikn            TEXT,             -- Hedef işletme IKN
  from_location     TEXT,             -- Kaynak adres
  to_location       TEXT,             -- Hedef adres
  vet_health_report TEXT,             -- Veteriner sağlık raporu no
  transport_company TEXT,             -- Nakliyeci
  plate_no          TEXT,             -- Araç plakası
  movement_reason   TEXT,             -- Hareket nedeni
  turkvet_bildiri_no TEXT,            -- TÜRKVET bildirim no
  notes             TEXT,
  recorded_by       UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HAYVAN MEDYA
-- ============================================================

CREATE TABLE animal_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id     UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  media_type    media_type NOT NULL DEFAULT 'photo',
  view_label    media_view_label NOT NULL DEFAULT 'other',
  order_index   INT NOT NULL DEFAULT 0,
  file_size_bytes BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DEĞİŞİKLİK LOGU
-- ============================================================

CREATE TABLE animal_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id   UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  changed_by  UUID REFERENCES users(id),
  action      TEXT NOT NULL,
  old_value   JSONB,
  new_value   JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHASE 2 PRE-ŞEMA: SATIŞLAR
-- ============================================================

CREATE TABLE animal_listings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id       UUID UNIQUE NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  price           DECIMAL(10,2),
  whatsapp_number TEXT,
  contact_phone   TEXT,
  is_public       BOOLEAN NOT NULL DEFAULT false,
  listed_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PHASE 3 PRE-ŞEMA: KURBAN
-- ============================================================

CREATE TABLE kurban_groups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id     UUID NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  total_price   DECIMAL(10,2) NOT NULL,
  max_partners  INT NOT NULL DEFAULT 7,
  deadline      DATE,
  status        TEXT NOT NULL DEFAULT 'open',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kurban_partners (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES kurban_groups(id) ON DELETE CASCADE,
  partner_name    TEXT NOT NULL,
  phone           TEXT,
  share_price     DECIMAL(10,2),
  is_confirmed    BOOLEAN NOT NULL DEFAULT false,
  confirmed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- İNDEKSLER
-- ============================================================

CREATE INDEX idx_animals_owner    ON animals(owner_id);
CREATE INDEX idx_animals_status   ON animals(status);
CREATE INDEX idx_animals_species  ON animals(species);
CREATE INDEX idx_animals_city     ON animals(city);
CREATE INDEX idx_animals_ear_tag  ON animals(ear_tag_no);
CREATE INDEX idx_animals_turkvet  ON animals(turkvet_no);
CREATE INDEX idx_animals_code     ON animals(animal_code);
CREATE INDEX idx_vaccinations_animal    ON vaccinations(animal_id);
CREATE INDEX idx_vaccinations_due       ON vaccinations(next_due_date);
CREATE INDEX idx_vet_exam_animal        ON vet_examinations(animal_id);
CREATE INDEX idx_health_records_animal  ON health_records(animal_id);
CREATE INDEX idx_medications_animal     ON medications(animal_id);
CREATE INDEX idx_medications_withdrawal ON medications(withdrawal_end);
CREATE INDEX idx_repro_animal           ON reproduction_records(animal_id);
CREATE INDEX idx_milk_animal            ON milk_records(animal_id);
CREATE INDEX idx_movements_animal       ON animal_movements(animal_id);

-- ============================================================
-- UPDATED_AT TRİGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER animals_updated_at BEFORE UPDATE ON animals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_media       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE vet_examinations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproduction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_movements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_listings    ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_my_role()     RETURNS TEXT AS $$ SELECT role::TEXT FROM users WHERE auth_id = auth.uid(); $$ LANGUAGE SQL SECURITY DEFINER;
CREATE OR REPLACE FUNCTION get_my_user_id()  RETURNS UUID AS $$ SELECT id FROM users WHERE auth_id = auth.uid(); $$ LANGUAGE SQL SECURITY DEFINER;

-- Users
CREATE POLICY "users_own"        ON users FOR ALL USING (auth_id = auth.uid() OR get_my_role() = 'admin');
CREATE POLICY "users_insert"     ON users FOR INSERT WITH CHECK (auth_id = auth.uid());

-- Animals
CREATE POLICY "animals_owner"    ON animals FOR ALL USING (owner_id = get_my_user_id() OR get_my_role() = 'admin');
CREATE POLICY "animals_public"   ON animals FOR SELECT USING (status = 'active');

-- Alt tablolar: sahip veya admin
DO $$ DECLARE t TEXT;
BEGIN FOR t IN SELECT unnest(ARRAY['animal_media','vaccinations','vet_examinations','health_records','medications','reproduction_records','milk_records','animal_movements','animal_logs']) LOOP
  EXECUTE format('CREATE POLICY "%s_owner" ON %s FOR ALL USING (EXISTS (SELECT 1 FROM animals a WHERE a.id = %s.animal_id AND (a.owner_id = get_my_user_id() OR get_my_role() = ''admin'')))', t, t, t);
END LOOP; END $$;

-- Listings
CREATE POLICY "listings_owner"  ON animal_listings FOR ALL USING (EXISTS (SELECT 1 FROM animals a WHERE a.id = animal_listings.animal_id AND (a.owner_id = get_my_user_id() OR get_my_role() = 'admin')));
CREATE POLICY "listings_public" ON animal_listings FOR SELECT USING (is_public = true);

-- ============================================================
-- VİEW'LAR
-- ============================================================

CREATE OR REPLACE VIEW animals_full AS
SELECT
  a.*,
  u.full_name   AS owner_name,
  u.phone       AS owner_phone,
  u.ikn         AS owner_ikn,
  u.isletme_adi AS owner_isletme,
  DATE_PART('year',  AGE(a.birth_date)) * 12 +
  DATE_PART('month', AGE(a.birth_date))       AS age_months,
  DATE_PART('year',  AGE(a.birth_date))       AS age_years,
  (SELECT COUNT(*) FROM animal_media    m WHERE m.animal_id = a.id) AS media_count,
  (SELECT COUNT(*) FROM vaccinations    v WHERE v.animal_id = a.id) AS vaccination_count,
  (SELECT MAX(applied_date) FROM vaccinations v2 WHERE v2.animal_id = a.id) AS last_vaccination_date,
  (SELECT MIN(next_due_date) FROM vaccinations v3 WHERE v3.animal_id = a.id AND v3.next_due_date >= CURRENT_DATE) AS next_vaccination_date,
  (SELECT COUNT(*) FROM medications     md WHERE md.animal_id = a.id AND md.withdrawal_end >= CURRENT_DATE) AS active_withdrawal_count
FROM animals a
JOIN users u ON u.id = a.owner_id;

-- Besici istatistikleri
CREATE OR REPLACE VIEW breeder_stats AS
SELECT
  u.id AS breeder_id, u.full_name, u.ikn, u.isletme_adi, u.isletme_il,
  COUNT(a.id)                                           AS total_animals,
  COUNT(a.id) FILTER (WHERE a.status = 'active')        AS active_count,
  COUNT(a.id) FILTER (WHERE a.status = 'reserved')      AS reserved_count,
  COUNT(a.id) FILTER (WHERE a.status = 'sold')          AS sold_count,
  COUNT(a.id) FILTER (WHERE a.status = 'slaughtered')   AS slaughtered_count,
  COUNT(a.id) FILTER (WHERE a.status = 'dead')          AS dead_count,
  COUNT(a.id) FILTER (WHERE a.status = 'archived')      AS archived_count,
  AVG(a.weight_kg) FILTER (WHERE a.status = 'active')   AS avg_weight_kg,
  AVG(a.avg_daily_milk_lt) FILTER (WHERE a.status = 'active' AND a.gender = 'disi') AS avg_milk_lt
FROM users u
LEFT JOIN animals a ON a.owner_id = u.id
WHERE u.role = 'breeder'
GROUP BY u.id, u.full_name, u.ikn, u.isletme_adi, u.isletme_il;

-- Yaklaşan aşı tarihleri uyarısı
CREATE OR REPLACE VIEW upcoming_vaccinations AS
SELECT
  v.id, v.animal_id, v.vaccine_name, v.next_due_date,
  a.ear_tag_no, a.animal_code, a.owner_id,
  u.full_name AS owner_name,
  (v.next_due_date - CURRENT_DATE) AS days_remaining
FROM vaccinations v
JOIN animals a ON a.id = v.animal_id
JOIN users u ON u.id = a.owner_id
WHERE v.next_due_date IS NOT NULL
  AND v.next_due_date >= CURRENT_DATE
  AND v.next_due_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY v.next_due_date;

-- İlaç bekleme süresi dolmamış hayvanlar
CREATE OR REPLACE VIEW active_withdrawals AS
SELECT
  md.id, md.animal_id, md.drug_name, md.withdrawal_end,
  a.ear_tag_no, a.animal_code, a.owner_id,
  (md.withdrawal_end - CURRENT_DATE) AS days_remaining
FROM medications md
JOIN animals a ON a.id = md.animal_id
WHERE md.withdrawal_end IS NOT NULL
  AND md.withdrawal_end >= CURRENT_DATE
ORDER BY md.withdrawal_end;
