// types/index.ts — MandıraM v1.1 (Türkiye Mevzuatına Uygun)

export type UserRole       = 'admin' | 'breeder' | 'viewer'
export type AnimalSpecies  = 'buyukbas' | 'kucukbas'
export type AnimalGender   = 'erkek' | 'disi'
export type AnimalStatus   = 'active' | 'reserved' | 'sold' | 'slaughtered' | 'dead' | 'lost' | 'archived'
export type PregnancyStatus = 'gebe' | 'gebe_degil' | 'bilinmiyor'
export type MovementType   = 'giris' | 'cikis' | 'dogum' | 'olum' | 'kayip' | 'kesim'

// ── KULLANICI ────────────────────────────────────────────────
export interface User {
  id: string
  auth_id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  // İşletme
  ikn?: string              // İşletme Kayıt Numarası
  isletme_adi?: string
  isletme_adres?: string
  isletme_il?: string
  isletme_ilce?: string
  isletme_koy?: string
  turkvet_kullanici_no?: string
  yetistirici_birligi?: string
  birlik_uye_no?: string
  is_active: boolean
  created_at: string
}

// ── HAYVAN ───────────────────────────────────────────────────
export interface Animal {
  id: string
  animal_code: string
  owner_id: string

  // Kimlik
  ear_tag_no: string
  ear_tag_no_2?: string
  chip_no?: string
  turkvet_no?: string
  pasaport_no?: string
  ikn?: string

  // Tür & Irk
  species: AnimalSpecies
  buyukbas_subtype?: 'sigir' | 'manda' | 'diger'
  kucukbas_subtype?: 'koyun' | 'keci' | 'diger'
  breed: string
  is_crossbreed: boolean
  crossbreed_detail?: string
  coat_color?: string
  distinctive_marks?: string

  // Cinsiyet & Üreme
  gender: AnimalGender
  is_castrated: boolean
  pregnancy_status: PregnancyStatus
  last_birth_date?: string
  total_births: number
  total_offspring: number

  // Soyağacı
  anne_kupe_no?: string
  baba_kupe_no?: string
  anne_irki?: string
  baba_irki?: string
  soy_kutugu_sinifi?: string    // A / B / C
  genomik_test: boolean
  genomik_test_tarihi?: string

  // Doğum
  birth_date: string
  birth_place_ikn?: string
  birth_type?: string           // Tekil / İkiz / Üçüz

  // Fiziksel
  weight_kg?: number
  est_slaughter_weight?: number
  height_cm?: number
  body_score?: number           // 1-5

  // Süt verimi
  avg_daily_milk_lt?: number
  lactation_count: number

  // Besi takibi
  besi_baslangic_tarihi?: string
  besi_baslangic_kg?: number
  hedef_kesim_tarihi?: string

  // Konum
  city: string
  district: string
  neighborhood?: string

  // Durum
  status: AnimalStatus
  status_date?: string
  status_notes?: string

  // Notlar
  health_notes?: string
  feed_notes?: string
  general_notes?: string

  // Sistem
  qr_code_url?: string
  cover_photo_url?: string
  created_at: string
  updated_at: string

  // View alanları (animals_full)
  owner_name?: string
  owner_phone?: string
  owner_ikn?: string
  owner_isletme?: string
  age_months?: number
  age_years?: number
  media_count?: number
  vaccination_count?: number
  last_vaccination_date?: string
  next_vaccination_date?: string
  active_withdrawal_count?: number
}

// ── AŞI ──────────────────────────────────────────────────────
export interface Vaccination {
  id: string
  animal_id: string
  vaccine_name: string
  vaccine_type?: string
  batch_no?: string
  applied_date: string
  applied_by?: string
  next_due_date?: string
  is_government: boolean
  notes?: string
  created_at: string
}

// ── VETERİNER MUAYENE ────────────────────────────────────────
export interface VetExamination {
  id: string
  animal_id: string
  exam_date: string
  vet_name?: string
  vet_clinic?: string
  exam_type: string           // Rutin / Acil / Kontrol / Hastalık
  diagnosis?: string
  treatment?: string
  prescription?: string
  follow_up_date?: string
  exam_fee?: number
  notes?: string
  created_at: string
}

// ── HASTALIK KAYDI ───────────────────────────────────────────
export interface HealthRecord {
  id: string
  animal_id: string
  record_date: string
  disease_name: string
  symptoms?: string
  diagnosis?: string
  treatment_start?: string
  treatment_end?: string
  outcome?: string            // İyileşti / Kronik / Öldü
  vet_name?: string
  notes?: string
  created_at: string
}

// ── İLAÇ ─────────────────────────────────────────────────────
export interface Medication {
  id: string
  animal_id: string
  applied_date: string
  drug_name: string
  drug_type?: string          // Antibiyotik / Parazit / Vitamin
  dose?: string
  route?: string              // IM / IV / Oral
  withdrawal_days?: number    // Et/süt bekleme süresi (gün)
  withdrawal_end?: string     // Bekleme bitiş tarihi
  applied_by?: string
  notes?: string
  created_at: string
}

// ── GEBELİK & DOĞUM ──────────────────────────────────────────
export interface ReproductionRecord {
  id: string
  animal_id: string
  record_type: 'tohumlama' | 'gebelik_tespiti' | 'dogum' | 'atik'
  record_date: string
  insemination_type?: string  // Suni / Tabii
  bull_ear_tag?: string
  semen_batch?: string
  pregnancy_confirmed?: boolean
  expected_birth_date?: string
  birth_date?: string
  offspring_count?: number
  offspring_gender?: string
  birth_difficulty?: string
  offspring_tags?: string
  notes?: string
  created_at: string
}

// ── SÜT VERİMİ ───────────────────────────────────────────────
export interface MilkRecord {
  id: string
  animal_id: string
  record_date: string
  lactation_no?: number
  morning_lt?: number
  evening_lt?: number
  total_lt?: number
  fat_percent?: number
  protein_percent?: number
  somatic_count?: number
  notes?: string
  created_at: string
}

// ── HAYVAN HAREKETİ ───────────────────────────────────────────
export interface AnimalMovement {
  id: string
  animal_id: string
  movement_type: MovementType
  movement_date: string
  from_ikn?: string
  to_ikn?: string
  from_location?: string
  to_location?: string
  vet_health_report?: string
  transport_company?: string
  plate_no?: string
  movement_reason?: string
  turkvet_bildiri_no?: string
  notes?: string
  created_at: string
}

// ── MEDYA ────────────────────────────────────────────────────
export interface AnimalMedia {
  id: string
  animal_id: string
  url: string
  storage_path: string
  media_type: 'photo' | 'video'
  view_label: 'front' | 'side' | 'teeth' | 'tail' | 'body' | 'other'
  order_index: number
  file_size_bytes?: number
  created_at: string
}

// ── SABIT VERİLER ─────────────────────────────────────────────

export const BUYUKBAS_BREEDS = [
  'Simental', 'Holstein', 'Angus', 'Hereford', 'Limuzin',
  'Charolais', 'Montofon', 'Brown Swiss (Esmer)',
  'Doğu Anadolu Kırmızısı', 'Güney Anadolu Kırmızısı',
  'Orta Anadolu Merinosu', 'Yerli Kara', 'Yerli Sarı',
  'Zavot', 'Boz Irk', 'Manda', 'Diğer'
]

export const KUCUKBAS_BREEDS = [
  'Akkaraman', 'Kıvırcık', 'Merinos', 'İvesi', 'Kangal Akkaraman',
  'Norduz', 'Tuj', 'Çine Çaparı', 'Sakız', 'Morkaraman',
  'Dağlıç', 'Hemşin', 'Karayaka', 'Tahirova',
  'Kıl Keçisi', 'Saanen', 'Ankara Keçisi (Tiftik)',
  'Halep', 'Malta', 'Honamlı', 'Diğer'
]

export const TURKISH_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya',
  'Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir',
  'Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis',
  'Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum',
  'Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan',
  'Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane',
  'Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir',
  'Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu',
  'Kayseri','Kilis','Kırıkkale','Kırklareli','Kırşehir',
  'Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin',
  'Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu',
  'Osmaniye','Rize','Sakarya','Samsun','Şanlıurfa','Siirt',
  'Sinop','Şırnak','Sivas','Tekirdağ','Tokat','Trabzon',
  'Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'
]

export const STATUS_LABELS: Record<AnimalStatus, string> = {
  active:      'Aktif',
  reserved:    'Rezerve',
  sold:        'Satıldı',
  slaughtered: 'Kesildi',
  dead:        'Öldü',
  lost:        'Kayıp',
  archived:    'Arşiv'
}

export const STATUS_COLORS: Record<AnimalStatus, string> = {
  active:      '#22c55e',
  reserved:    '#f59e0b',
  sold:        '#6b7280',
  slaughtered: '#dc2626',
  dead:        '#7f1d1d',
  lost:        '#7c3aed',
  archived:    '#9ca3af'
}

export const VACCINE_NAMES = [
  'Şap Aşısı', 'Brucella Aşısı', 'Antraks Aşısı',
  'Clostridial Aşı', 'IBR/BVD Aşısı', 'Leptospira Aşısı',
  'Pastörella Aşısı', 'E.coli Aşısı', 'Rotavirus Aşısı',
  'Mavi Dil Aşısı', 'Lumpy Skin Aşısı', 'PPR Aşısı (Koyun-Keçi)',
  'Enterotoksemi Aşısı', 'Çiçek Aşısı (Koyun)', 'Diğer'
]

export const DRUG_TYPES = [
  'Antibiyotik', 'Antiparaziter', 'Vitamin & Mineral',
  'Hormon', 'Anti-inflamatuar', 'Anestezik',
  'Probiyotik', 'Diğer'
]

export const EXAM_TYPES = [
  'Rutin Kontrol', 'Acil Muayene', 'Doğum Yardımı',
  'Aşılama', 'Küpeleme', 'Hastalık Tedavisi', 'Diğer'
]
