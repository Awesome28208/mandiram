// lib/animals.ts
import { supabase } from './supabase'
import { Animal, AnimalFormData, AnimalMedia, AnimalStatus, BreederStats } from '../types'
import QRCode from 'qrcode'

// ─── CREATE ───────────────────────────────────────────────

export async function createAnimal(
  data: AnimalFormData,
  ownerId: string
): Promise<Animal> {
  const { data: animal, error } = await supabase
    .from('animals')
    .insert({ ...data, owner_id: ownerId })
    .select()
    .single()

  if (error) throw error

  // Generate QR code
  await generateAndSaveQR(animal.id, animal.animal_code)

  return animal
}

// ─── READ ─────────────────────────────────────────────────

export async function getMyAnimals(filters?: {
  species?: string
  status?: AnimalStatus
  city?: string
  breed?: string
  minWeight?: number
  maxWeight?: number
  search?: string
}): Promise<Animal[]> {
  let query = supabase
    .from('animals_full')
    .select('*')

  if (filters?.species) query = query.eq('species', filters.species)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.city) query = query.eq('city', filters.city)
  if (filters?.breed) query = query.eq('breed', filters.breed)
  if (filters?.minWeight) query = query.gte('weight_kg', filters.minWeight)
  if (filters?.maxWeight) query = query.lte('weight_kg', filters.maxWeight)
  if (filters?.search) {
    query = query.or(
      `ear_tag_no.ilike.%${filters.search}%,animal_code.ilike.%${filters.search}%`
    )
  }

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getAnimalById(id: string): Promise<Animal | null> {
  const { data, error } = await supabase
    .from('animals_full')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getAnimalMedia(animalId: string): Promise<AnimalMedia[]> {
  const { data, error } = await supabase
    .from('animal_media')
    .select('*')
    .eq('animal_id', animalId)
    .order('order_index')

  if (error) throw error
  return data || []
}

export async function getBreederStats(breederId: string): Promise<BreederStats | null> {
  const { data, error } = await supabase
    .from('breeder_stats')
    .select('*')
    .eq('breeder_id', breederId)
    .single()

  if (error) return null
  return data
}

// ─── UPDATE ───────────────────────────────────────────────

export async function updateAnimal(
  id: string,
  updates: Partial<AnimalFormData>
): Promise<Animal> {
  const { data, error } = await supabase
    .from('animals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateAnimalStatus(
  id: string,
  status: AnimalStatus
): Promise<void> {
  const { error } = await supabase
    .from('animals')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

// ─── DELETE ───────────────────────────────────────────────

export async function archiveAnimal(id: string): Promise<void> {
  await updateAnimalStatus(id, 'archived')
}

// ─── MEDIA ────────────────────────────────────────────────

export async function uploadAnimalPhoto(
  animalId: string,
  file: File,
  viewLabel: AnimalMedia['view_label'],
  orderIndex: number
): Promise<AnimalMedia> {
  const ext = file.name.split('.').pop()
  const path = `animals/${animalId}/${viewLabel}-${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('animal-media')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('animal-media')
    .getPublicUrl(path)

  const { data, error } = await supabase
    .from('animal_media')
    .insert({
      animal_id: animalId,
      url: urlData.publicUrl,
      storage_path: path,
      media_type: 'photo',
      view_label: viewLabel,
      order_index: orderIndex,
      file_size_bytes: file.size
    })
    .select()
    .single()

  if (error) throw error

  // Set as cover photo if first image
  if (orderIndex === 0) {
    await supabase
      .from('animals')
      .update({ cover_photo_url: urlData.publicUrl })
      .eq('id', animalId)
  }

  return data
}

export async function deleteAnimalMedia(mediaId: string, storagePath: string): Promise<void> {
  await supabase.storage.from('animal-media').remove([storagePath])
  const { error } = await supabase.from('animal_media').delete().eq('id', mediaId)
  if (error) throw error
}

// ─── QR CODE ──────────────────────────────────────────────

export async function generateAndSaveQR(animalId: string, animalCode: string): Promise<string> {
  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${animalId}`

  const qrDataUrl = await QRCode.toDataURL(scanUrl, {
    width: 300,
    margin: 2,
    color: { dark: '#2D6A4F', light: '#FFFFFF' }
  })

  // Convert data URL to blob and upload
  const response = await fetch(qrDataUrl)
  const blob = await response.blob()
  const path = `qr-codes/${animalId}.png`

  await supabase.storage
    .from('animal-media')
    .upload(path, blob, { contentType: 'image/png', upsert: true })

  const { data: urlData } = supabase.storage
    .from('animal-media')
    .getPublicUrl(path)

  await supabase
    .from('animals')
    .update({ qr_code_url: urlData.publicUrl })
    .eq('id', animalId)

  return urlData.publicUrl
}

// ─── EXPORT ───────────────────────────────────────────────

export async function exportAnimalsCSV(animals: Animal[]): Promise<void> {
  const headers = [
    'Hayvan Kodu', 'Küpe No', 'Tür', 'Irk', 'Cinsiyet', 'Doğum Tarihi',
    'Yaş (Ay)', 'Ağırlık (kg)', 'Şehir', 'İlçe', 'Durum', 'Sağlık Notları'
  ]

  const rows = animals.map(a => [
    a.animal_code,
    a.ear_tag_no,
    a.species === 'buyukbas' ? 'Büyükbaş' : 'Küçükbaş',
    a.breed,
    a.gender === 'erkek' ? 'Erkek' : 'Dişi',
    a.birth_date,
    a.age_months ?? '',
    a.weight_kg ?? '',
    a.city,
    a.district,
    a.status,
    a.health_notes ?? ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${v}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `mandiram-hayvanlar-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
