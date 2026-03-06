// lib/uploadPhoto.ts
import { createClient } from './supabase'

export async function uploadAnimalPhoto(
  file: File,
  animalCode: string
): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${animalCode}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('animal-media')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    console.error('Fotoğraf yükleme hatası:', error)
    return null
  }

  const { data } = supabase.storage
    .from('animal-media')
    .getPublicUrl(path)

  return data.publicUrl
}
