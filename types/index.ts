// types/index.ts

export type UserRole = 'admin' | 'breeder' | 'viewer'
export type AnimalSpecies = 'buyukbas' | 'kucukbas'
export type AnimalGender = 'erkek' | 'disi'
export type AnimalStatus = 'active' | 'reserved' | 'sold' | 'slaughtered' | 'archived'
export type MediaViewLabel = 'front' | 'side' | 'teeth' | 'tail' | 'body' | 'other'

export interface User {
  id: string
  auth_id: string
  email: string
  full_name: string
  phone?: string
  role: UserRole
  city?: string
  district?: string
  is_active: boolean
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Animal {
  id: string
  animal_code: string
  ear_tag_no: string
  chip_no?: string
  owner_id: string
  species: AnimalSpecies
  breed: string
  gender: AnimalGender
  birth_date: string
  weight_kg?: number
  est_slaughter_weight?: number
  city: string
  district: string
  status: AnimalStatus
  health_notes?: string
  vaccination_notes?: string
  qr_code_url?: string
  cover_photo_url?: string
  created_at: string
  updated_at: string
  // from animals_full view
  owner_name?: string
  owner_phone?: string
  age_months?: number
  age_years?: number
  media_count?: number
}

export interface AnimalMedia {
  id: string
  animal_id: string
  url: string
  storage_path: string
  media_type: 'photo' | 'video'
  view_label: MediaViewLabel
  order_index: number
  file_size_bytes?: number
  created_at: string
}

export interface BreederStats {
  breeder_id: string
  full_name: string
  city: string
  total_animals: number
  active_count: number
  reserved_count: number
  sold_count: number
  archived_count: number
  avg_weight_kg?: number
}

export interface AnimalFormData {
  ear_tag_no: string
  chip_no?: string
  species: AnimalSpecies
  breed: string
  gender: AnimalGender
  birth_date: string
  weight_kg?: number
  est_slaughter_weight?: number
  city: string
  district: string
  health_notes?: string
  vaccination_notes?: string
}

// Breed options per species
export const BUYUKBAS_BREEDS = [
  'Simental', 'Holstein', 'Angus', 'Hereford', 'Limuzin',
  'Charolais', 'Montofon', 'Brown Swiss', 'Doğu Anadolu Kırmızısı',
  'Güney Anadolu Kırmızısı', 'Yerli Kara', 'Yerli Sarı', 'Diğer'
]

export const KUCUKBAS_BREEDS = [
  'Akkaraman', 'Kıvırcık', 'Merinos', 'İvesi', 'Kangal Akkaraman',
  'Norduz', 'Tuj', 'Çine Çaparı', 'Sakız', 'Kıl Keçisi',
  'Saanen', 'Ankara Keçisi', 'Halep', 'Malta', 'Diğer'
]

export const TURKISH_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara',
  'Antalya', 'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl',
  'Bitlis', 'Bolu', 'Burdur', 'Bursa', 'Çanakkale', 'Çankırı',
  'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari',
  'Hatay', 'Isparta', 'İçel', 'İstanbul', 'İzmir', 'Kars',
  'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
  'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya',
  'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Tekirdağ', 'Tokat',
  'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat',
  'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman',
  'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük',
  'Kilis', 'Osmaniye', 'Düzce'
]

export const STATUS_LABELS: Record<AnimalStatus, string> = {
  active: 'Aktif',
  reserved: 'Rezerve',
  sold: 'Satıldı',
  slaughtered: 'Kesildi',
  archived: 'Arşiv'
}

export const STATUS_COLORS: Record<AnimalStatus, string> = {
  active: '#22c55e',
  reserved: '#f59e0b',
  sold: '#6b7280',
  slaughtered: '#ef4444',
  archived: '#9ca3af'
}

export const SPECIES_LABELS: Record<AnimalSpecies, string> = {
  buyukbas: 'Büyükbaş',
  kucukbas: 'Küçükbaş'
}

export const MEDIA_VIEW_LABELS: Record<MediaViewLabel, string> = {
  front: 'Ön Görünüm',
  side: 'Yan Görünüm',
  teeth: 'Diş',
  tail: 'Kuyruk',
  body: 'Genel Vücut',
  other: 'Diğer'
}
