'use client'
// app/animals/[id]/page.tsx — Adım 10: Silme + Inline Onay + Süt Grafiği

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const S = {
  active:      { label: 'Aktif',    color: '#16a34a', bg: '#f0fdf4' },
  reserved:    { label: 'Rezerve', color: '#d97706', bg: '#fffbeb' },
  sold:        { label: 'Satıldı', color: '#4b5563', bg: '#f9fafb' },
  slaughtered: { label: 'Kesildi', color: '#dc2626', bg: '#fef2f2' },
  dead:        { label: 'Öldü',    color: '#7f1d1d', bg: '#fef2f2' },
  lost:        { label: 'Kayıp',   color: '#7c3aed', bg: '#f5f3ff' },
  archived:    { label: 'Arşiv',   color: '#9ca3af', bg: '#f3f4f6' },
} as Record<string, any>

function calcAge(d: string | null) {
  if (!d) return null
  const b = new Date(d); if (isNaN(b.getTime())) return null
  const n = new Date()
  let y = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth()
  if (m < 0) { y--; m += 12 }
  return { y, m }
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f1' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1a2e1a', fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14 }}>{text}</div>
    </div>
  )
}

// ── İNLINE SİLME BUTONU ───────────────────────────────────────────────────────
function DeleteBtn({ onDelete, deleting }: { onDelete: () => void; deleting: boolean }) {
  const [confirm, setConfirm] = useState(false)
  if (deleting) return <span style={{ fontSize: 11, color: '#9ca3af' }}>⏳</span>
  if (confirm) return (
    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Emin misin?</span>
      <button onClick={onDelete} style={{ background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Evet</button>
      <button onClick={() => setConfirm(false)} style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Hayır</button>
    </span>
  )
  return (
    <button onClick={() => setConfirm(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16, padding: '2px 4px', opacity: 0.6, lineHeight: 1 }} title="Sil">🗑</button>
  )
}

// ── FOTOĞRAF GALERİSİ ─────────────────────────────────────────────────────────
function PhotosTab({ animalId, coverPhotoUrl }: { animalId: string; coverPhotoUrl?: string }) {
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('animal_media').select('*').eq('animal_id', animalId).order('created_at', { ascending: false })
    setPhotos(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [animalId])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    const supabase = createClient()
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${animalId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('animal-media').upload(path, file, { upsert: false, contentType: file.type })
      if (!error) {
        const { data: urlData } = supabase.storage.from('animal-media').getPublicUrl(path)
        await supabase.from('animal_media').insert({ animal_id: animalId, media_type: "photo", url: urlData.publicUrl, storage_path: path, view_label: file.name, file_size_bytes: file.size })
      }
    }
    await load()
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (photo: any) => {
    if (!confirm('Bu fotoğrafı silmek istiyor musunuz?')) return
    const supabase = createClient()
    await supabase.storage.from('animal-media').remove([photo.storage_path])
    await supabase.from('animal_media').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  const allPhotos = [
    ...(coverPhotoUrl ? [{ id: 'cover', url: coverPhotoUrl, is_cover: true }] : []),
    ...photos.filter(p => p.url !== coverPhotoUrl)
  ]

  return (
    <div>
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 24, width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontWeight: 900 }}>×</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{allPhotos.length} fotoğraf</div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: uploading ? 0.6 : 1 }}>
          {uploading ? '⏳ Yükleniyor…' : '📷 Fotoğraf Ekle'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: 'none' }} />
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Yükleniyor…</div>
      ) : allPhotos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
          <div style={{ fontSize: 14 }}>Henüz fotoğraf yok</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {allPhotos.map((photo) => (
            <div key={photo.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#f3f4f6', border: photo.is_cover ? '3px solid #2D6A4F' : '1px solid #e5e7eb' }}>
              <img src={photo.url} alt="" onClick={() => setLightbox(photo.url)} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
              {photo.is_cover && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: '#2D6A4F', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 6 }}>KAPAK</div>
              )}
              {!photo.is_cover && (
                <button onClick={() => handleDelete(photo)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(220,38,38,0.85)', border: 'none', color: 'white', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── AŞI ───────────────────────────────────────────────────────────────────────
function VaccinationsTab({ animalId }: { animalId: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ vaccine_name: '', vaccine_type: '', applied_date: '', next_due_date: '', applied_by: '', is_government: false, batch_no: '', notes: '' })

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('vaccinations').select('*').eq('animal_id', animalId).order('applied_date', { ascending: false })
    setData(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [animalId])

  const save = async () => {
    if (!form.vaccine_name || !form.applied_date) return alert('Aşı adı ve tarih zorunlu!')
    setSaving(true)
    const supabase = createClient()
    await supabase.from('vaccinations').insert({ ...form, animal_id: animalId })
    await load()
    setShowForm(false)
    setForm({ vaccine_name: '', vaccine_type: '', applied_date: '', next_due_date: '', applied_by: '', is_government: false, batch_no: '', notes: '' })
    setSaving(false)
  }

  const deleteRecord = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('vaccinations').delete().eq('id', id)
    setData(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  if (loading) return <div style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>Yükleniyor…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a2e1a' }}>💉 Aşı Kayıtları ({data.length})</div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? '✕ İptal' : '+ Ekle'}
        </button>
      </div>
      {showForm && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['vaccine_name','Aşı Adı *','text'],['vaccine_type','Aşı Türü / Üretici','text'],['applied_date','Uygulama Tarihi *','date'],['next_due_date','Sonraki Aşı Tarihi','date'],['applied_by','Uygulayan','text'],['batch_no','Parti No','text']].map(([k,lbl,t]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type={t} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Notlar</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_government} onChange={e => setForm(f => ({ ...f, is_government: e.target.checked }))} />
            Devlet programlı aşı
          </label>
          <button onClick={save} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}
      {data.length === 0 ? <EmptyState icon="💉" text="Henüz aşı kaydı yok" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map(v => (
            <div key={v.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1a2e1a' }}>{v.vaccine_name}</div>
                  {v.vaccine_type && <div style={{ fontSize: 12, color: '#6b7280' }}>{v.vaccine_type}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{v.applied_date}</div>
                  <DeleteBtn onDelete={() => deleteRecord(v.id)} deleting={deleting === v.id} />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {v.is_government && <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>🏛 Devlet Programlı</span>}
                {v.next_due_date && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>📅 Sonraki: {v.next_due_date}</span>}
                {v.applied_by && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{v.applied_by}</span>}
              </div>
              {v.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>📝 {v.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SAĞLIK ────────────────────────────────────────────────────────────────────
function HealthTab({ animalId }: { animalId: string }) {
  const [health, setHealth] = useState<any[]>([])
  const [meds, setMeds] = useState<any[]>([])
  const [vets, setVets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'health' | 'meds' | 'vets'>('health')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [hForm, setHForm] = useState({ record_date: '', disease_name: '', symptoms: '', diagnosis: '', treatment_start: '', treatment_end: '', outcome: '', vet_name: '', notes: '' })
  const [mForm, setMForm] = useState({ applied_date: '', drug_name: '', drug_type: '', dose: '', route: '', withdrawal_days: '', applied_by: '', notes: '' })
  const [vForm, setVForm] = useState({ exam_date: '', vet_name: '', exam_type: 'Rutin', diagnosis: '', treatment: '', follow_up_date: '', exam_fee: '', notes: '' })

  const loadAll = async () => {
    const supabase = createClient()
    const [h, m, v] = await Promise.all([
      supabase.from('health_records').select('*').eq('animal_id', animalId).order('record_date', { ascending: false }),
      supabase.from('medications').select('*').eq('animal_id', animalId).order('applied_date', { ascending: false }),
      supabase.from('vet_examinations').select('*').eq('animal_id', animalId).order('exam_date', { ascending: false }),
    ])
    setHealth(h.data || [])
    setMeds(m.data || [])
    setVets(v.data || [])
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [animalId])

  const saveHealth = async () => {
    if (!hForm.record_date || !hForm.disease_name) return alert('Tarih ve hastalık adı zorunlu!')
    setSaving(true)
    const supabase = createClient()
    await supabase.from('health_records').insert({ ...hForm, animal_id: animalId })
    const { data: fresh } = await supabase.from('health_records').select('*').eq('animal_id', animalId).order('record_date', { ascending: false })
    setHealth(fresh || [])
    setShowForm(false)
    setHForm({ record_date: '', disease_name: '', symptoms: '', diagnosis: '', treatment_start: '', treatment_end: '', outcome: '', vet_name: '', notes: '' })
    setSaving(false)
  }

  const saveMed = async () => {
    if (!mForm.applied_date || !mForm.drug_name) return alert('Tarih ve ilaç adı zorunlu!')
    setSaving(true)
    const supabase = createClient()
    const withdrawal_end = mForm.withdrawal_days && mForm.applied_date
      ? new Date(new Date(mForm.applied_date).getTime() + parseInt(mForm.withdrawal_days) * 86400000).toISOString().split('T')[0]
      : null
    await supabase.from('medications').insert({ ...mForm, withdrawal_days: mForm.withdrawal_days ? parseInt(mForm.withdrawal_days) : null, withdrawal_end, animal_id: animalId })
    const { data: fresh } = await supabase.from('medications').select('*').eq('animal_id', animalId).order('applied_date', { ascending: false })
    setMeds(fresh || [])
    setShowForm(false)
    setMForm({ applied_date: '', drug_name: '', drug_type: '', dose: '', route: '', withdrawal_days: '', applied_by: '', notes: '' })
    setSaving(false)
  }

  const saveVet = async () => {
    if (!vForm.exam_date || !vForm.exam_type) return alert('Tarih ve muayene türü zorunlu!')
    setSaving(true)
    const supabase = createClient()
    await supabase.from('vet_examinations').insert({ ...vForm, exam_fee: vForm.exam_fee ? parseFloat(vForm.exam_fee) : null, animal_id: animalId })
    const { data: fresh } = await supabase.from('vet_examinations').select('*').eq('animal_id', animalId).order('exam_date', { ascending: false })
    setVets(fresh || [])
    setShowForm(false)
    setVForm({ exam_date: '', vet_name: '', exam_type: 'Rutin', diagnosis: '', treatment: '', follow_up_date: '', exam_fee: '', notes: '' })
    setSaving(false)
  }

  const deleteRecord = async (table: string, id: string, setter: (fn: (prev: any[]) => any[]) => void) => {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from(table).delete().eq('id', id)
    setter(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  if (loading) return <div style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>Yükleniyor…</div>

  const sections = [
    { key: 'health', label: `🏥 Hastalıklar (${health.length})` },
    { key: 'meds',   label: `💊 İlaçlar (${meds.length})` },
    { key: 'vets',   label: `👨‍⚕️ Muayeneler (${vets.length})` },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => { setActiveSection(s.key as any); setShowForm(false) }}
            style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: activeSection === s.key ? '#2D6A4F' : 'white',
              color: activeSection === s.key ? 'white' : '#2D6A4F',
              borderColor: activeSection === s.key ? '#2D6A4F' : '#d1d5db' }}>
            {s.label}
          </button>
        ))}
        <button onClick={() => setShowForm(s => !s)} style={{ marginLeft: 'auto', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? '✕ İptal' : '+ Ekle'}
        </button>
      </div>

      {/* Hastalık Formu */}
      {showForm && activeSection === 'health' && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['record_date','Tarih *','date'],['disease_name','Hastalık Adı *','text'],['symptoms','Belirtiler','text'],['diagnosis','Tanı','text'],['treatment_start','Tedavi Başlangıç','date'],['treatment_end','Tedavi Bitiş','date'],['outcome','Sonuç (İyileşti/Kronik)','text'],['vet_name','Veteriner','text']].map(([k,lbl,t]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type={t} value={(hForm as any)[k]} onChange={e => setHForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <button onClick={saveHealth} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {/* İlaç Formu */}
      {showForm && activeSection === 'meds' && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['applied_date','Uygulama Tarihi *','date'],['drug_name','İlaç Adı *','text'],['drug_type','İlaç Türü','text'],['dose','Doz','text'],['route','Uygulama Yolu (IM/IV/Oral)','text'],['withdrawal_days','Bekleme Süresi (gün)','number'],['applied_by','Uygulayan','text']].map(([k,lbl,t]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type={t} value={(mForm as any)[k]} onChange={e => setMForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <button onClick={saveMed} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {/* Veteriner Formu */}
      {showForm && activeSection === 'vets' && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['exam_date','Muayene Tarihi *','date'],['vet_name','Veteriner','text'],['diagnosis','Tanı','text'],['treatment','Tedavi','text'],['follow_up_date','Kontrol Tarihi','date'],['exam_fee','Muayene Ücreti (₺)','number']].map(([k,lbl,t]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type={t} value={(vForm as any)[k]} onChange={e => setVForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Muayene Türü</label>
              <select value={vForm.exam_type} onChange={e => setVForm(f => ({ ...f, exam_type: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                {['Rutin','Acil','Kontrol','Hastalık'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveVet} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {/* Hastalık listesi */}
      {activeSection === 'health' && (
        health.length === 0 ? <EmptyState icon="🏥" text="Hastalık kaydı yok" /> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {health.map(h => (
            <div key={h.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, color: '#dc2626' }}>🏥 {h.disease_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{h.record_date}</div>
                  <DeleteBtn onDelete={() => deleteRecord('health_records', h.id, setHealth)} deleting={deleting === h.id} />
                </div>
              </div>
              {h.symptoms && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Belirtiler: {h.symptoms}</div>}
              {h.diagnosis && <div style={{ fontSize: 12, color: '#6b7280' }}>Tanı: {h.diagnosis}</div>}
              {h.outcome && <span style={{ display: 'inline-block', marginTop: 6, background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{h.outcome}</span>}
            </div>
          ))}
        </div>
      )}

      {/* İlaç listesi */}
      {activeSection === 'meds' && (
        meds.length === 0 ? <EmptyState icon="💊" text="İlaç kaydı yok" /> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {meds.map(m => (
            <div key={m.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, color: '#1a2e1a' }}>💊 {m.drug_name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.applied_date}</div>
                  <DeleteBtn onDelete={() => deleteRecord('medications', m.id, setMeds)} deleting={deleting === m.id} />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {m.drug_type && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{m.drug_type}</span>}
                {m.dose && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>Doz: {m.dose}</span>}
                {m.withdrawal_days && (
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                    ⚠️ {m.withdrawal_days}g bekleme {m.withdrawal_end ? `(${m.withdrawal_end}'e kadar)` : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vet listesi */}
      {activeSection === 'vets' && (
        vets.length === 0 ? <EmptyState icon="👨‍⚕️" text="Muayene kaydı yok" /> :
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vets.map(v => (
            <div key={v.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 800, color: '#1a2e1a' }}>👨‍⚕️ {v.exam_type} Muayene</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{v.exam_date}</div>
                  <DeleteBtn onDelete={() => deleteRecord('vet_examinations', v.id, setVets)} deleting={deleting === v.id} />
                </div>
              </div>
              {v.vet_name && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{v.vet_name}</div>}
              {v.diagnosis && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Tanı: {v.diagnosis}</div>}
              {v.treatment && <div style={{ fontSize: 12, color: '#6b7280' }}>Tedavi: {v.treatment}</div>}
              {v.exam_fee && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>₺{v.exam_fee}</div>}
              {v.follow_up_date && <span style={{ display: 'inline-block', marginTop: 6, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>📅 Kontrol: {v.follow_up_date}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SÜT VERİMİ (grafik dahil) ────────────────────────────────────────────────
function MilkTab({ animalId }: { animalId: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showChart, setShowChart] = useState(false)
  const [form, setForm] = useState({ record_date: '', morning_lt: '', evening_lt: '', fat_percent: '', protein_percent: '', lactation_no: '1', notes: '' })

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('milk_records').select('*').eq('animal_id', animalId).order('record_date', { ascending: false })
    setData(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [animalId])

  const save = async () => {
    if (!form.record_date) return alert('Tarih zorunlu!')
    setSaving(true)
    const supabase = createClient()
    const morning = parseFloat(form.morning_lt) || 0
    const evening = parseFloat(form.evening_lt) || 0
    await supabase.from('milk_records').insert({
      animal_id: animalId, record_date: form.record_date,
      morning_lt: morning || null, evening_lt: evening || null,
      total_lt: morning + evening || null,
      fat_percent: form.fat_percent ? parseFloat(form.fat_percent) : null,
      protein_percent: form.protein_percent ? parseFloat(form.protein_percent) : null,
      lactation_no: parseInt(form.lactation_no) || 1,
      notes: form.notes || null,
    })
    await load()
    setShowForm(false)
    setForm({ record_date: '', morning_lt: '', evening_lt: '', fat_percent: '', protein_percent: '', lactation_no: '1', notes: '' })
    setSaving(false)
  }

  const deleteRecord = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('milk_records').delete().eq('id', id)
    setData(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  // Aylık özet
  const monthlyStats = () => {
    const grouped: Record<string, number[]> = {}
    data.forEach(r => {
      const m = r.record_date?.slice(0, 7)
      if (m && r.total_lt) { if (!grouped[m]) grouped[m] = []; grouped[m].push(r.total_lt) }
    })
    return Object.entries(grouped).map(([month, vals]) => ({
      month, total: vals.reduce((a, b) => a + b, 0),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length,
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  if (loading) return <div style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>Yükleniyor…</div>

  const stats = monthlyStats()
  const maxVal = stats.length ? Math.max(...stats.map(s => s.total)) : 1

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a2e1a' }}>🥛 Süt Verimi ({data.length} kayıt)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {stats.length > 1 && (
            <button onClick={() => setShowChart(s => !s)} style={{ background: showChart ? '#e0f2fe' : 'white', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {showChart ? '📋 Liste' : '📈 Grafik'}
            </button>
          )}
          <button onClick={() => setShowForm(s => !s)} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {showForm ? '✕ İptal' : '+ Kayıt Ekle'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[['record_date','Tarih *','date'],['morning_lt','Sabah Sütü (lt)','number'],['evening_lt','Akşam Sütü (lt)','number'],['fat_percent','Yağ Oranı (%)','number'],['protein_percent','Protein Oranı (%)','number'],['lactation_no','Laktasyon No','number']].map(([k,lbl,t]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type={t} step="0.01" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {/* GRAFİK — bar chart (CSS tabanlı) */}
      {showChart && stats.length > 1 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#6b7280', marginBottom: 12 }}>📈 Aylık Toplam Süt (lt)</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, overflowX: 'auto', paddingBottom: 4 }}>
            {stats.map((s, i) => {
              const prev = stats[i - 1]
              const pct = Math.round((s.total / maxVal) * 100)
              const change = prev ? s.total - prev.total : 0
              const isUp = change >= 0
              return (
                <div key={s.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 44 }}>
                  {prev && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: isUp ? '#16a34a' : '#dc2626' }}>
                      {isUp ? '▲' : '▼'}{Math.abs(change).toFixed(1)}
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#2D6A4F' }}>{s.total.toFixed(0)}</div>
                  <div style={{ width: 36, height: `${pct}%`, minHeight: 4, background: 'linear-gradient(to top, #2D6A4F, #52B788)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                  <div style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', lineHeight: 1.2 }}>{s.month.slice(5)}/{s.month.slice(2, 4)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Aylık özet tablo */}
      {!showChart && stats.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Aylık Özet</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0fdf4' }}>
                  {['Ay','Toplam (lt)','Günlük Ort.','Kayıt'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#2D6A4F', borderBottom: '2px solid #d1fae5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...stats].reverse().map((s, i, arr) => {
                  const prev = arr[i + 1]
                  const change = prev ? ((s.total - prev.total) / prev.total * 100).toFixed(0) : null
                  return (
                    <tr key={s.month} style={{ borderBottom: '1px solid #f1f5f1' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{s.month}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {s.total.toFixed(1)} lt
                        {change && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, color: parseFloat(change) > 0 ? '#16a34a' : '#dc2626' }}>
                          {parseFloat(change) > 0 ? '▲' : '▼'} {Math.abs(parseFloat(change))}%
                        </span>}
                      </td>
                      <td style={{ padding: '8px 12px' }}>{s.avg.toFixed(2)} lt</td>
                      <td style={{ padding: '8px 12px', color: '#9ca3af' }}>{s.count} gün</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length === 0 ? <EmptyState icon="🥛" text="Süt verimi kaydı yok" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.slice(0, 30).map(r => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: '#1a2e1a', fontWeight: 700 }}>{r.record_date}</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
                {r.morning_lt && <span style={{ color: '#0369a1' }}>☀️ {r.morning_lt}lt</span>}
                {r.evening_lt && <span style={{ color: '#7c3aed' }}>🌙 {r.evening_lt}lt</span>}
                {r.total_lt && <span style={{ fontWeight: 800, color: '#2D6A4F' }}>= {r.total_lt}lt</span>}
                {r.fat_percent && <span style={{ color: '#9ca3af', fontSize: 11 }}>%{r.fat_percent}yağ</span>}
                <DeleteBtn onDelete={() => deleteRecord(r.id)} deleting={deleting === r.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ÜREME ─────────────────────────────────────────────────────────────────────
function ReproductionTab({ animalId }: { animalId: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ record_type: 'tohumlama', record_date: '', insemination_type: 'Suni', bull_ear_tag: '', expected_birth_date: '', birth_date: '', offspring_count: '', offspring_gender: '', notes: '' })

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('reproduction_records').select('*').eq('animal_id', animalId).order('record_date', { ascending: false })
    setData(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [animalId])

  const save = async () => {
    if (!form.record_date || !form.record_type) return alert('Tarih ve tür zorunlu!')
    setSaving(true)
    const supabase = createClient()
    await supabase.from('reproduction_records').insert({
      ...form, animal_id: animalId,
      offspring_count: form.offspring_count ? parseInt(form.offspring_count) : null,
      pregnancy_confirmed: form.record_type === 'gebelik_tespiti' ? true : null,
    })
    await load()
    setShowForm(false)
    setForm({ record_type: 'tohumlama', record_date: '', insemination_type: 'Suni', bull_ear_tag: '', expected_birth_date: '', birth_date: '', offspring_count: '', offspring_gender: '', notes: '' })
    setSaving(false)
  }

  const deleteRecord = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('reproduction_records').delete().eq('id', id)
    setData(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const typeLabel: Record<string, string> = { tohumlama: '🔬 Tohumlama', gebelik_tespiti: '🤰 Gebelik Tespiti', dogum: '🐣 Doğum', atik: '⚠️ Atık' }
  const typeBg: Record<string, string> = { tohumlama: '#e0f2fe', gebelik_tespiti: '#fce7f3', dogum: '#f0fdf4', atik: '#fef3c7' }
  const typeColor: Record<string, string> = { tohumlama: '#0369a1', gebelik_tespiti: '#9d174d', dogum: '#16a34a', atik: '#92400e' }

  if (loading) return <div style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>Yükleniyor…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a2e1a' }}>🐣 Üreme Kayıtları ({data.length})</div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? '✕ İptal' : '+ Ekle'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Kayıt Türü *</label>
              <select value={form.record_type} onChange={e => setForm(f => ({ ...f, record_type: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                <option value="tohumlama">Tohumlama</option>
                <option value="gebelik_tespiti">Gebelik Tespiti</option>
                <option value="dogum">Doğum</option>
                <option value="atik">Atık</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Tarih *</label>
              <input type="date" value={form.record_date} onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            {form.record_type === 'tohumlama' && (
              <>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Tohumlama Türü</label>
                  <select value={form.insemination_type} onChange={e => setForm(f => ({ ...f, insemination_type: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                    <option>Suni</option><option>Tabii</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Boğa Küpe No</label>
                  <input type="text" value={form.bull_ear_tag} onChange={e => setForm(f => ({ ...f, bull_ear_tag: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Tahmini Doğum Tarihi</label>
                  <input type="date" value={form.expected_birth_date} onChange={e => setForm(f => ({ ...f, expected_birth_date: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              </>
            )}
            {form.record_type === 'dogum' && (
              <>
                {[['offspring_count','Yavru Sayısı','number'],['offspring_gender','Cinsiyet (erkek/dişi/karışık)','text']].map(([k,lbl,t]) => (
                  <div key={k}>
                    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                    <input type={t} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Notlar</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <button onClick={save} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {data.length === 0 ? <EmptyState icon="🐣" text="Üreme kaydı yok" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map(r => (
            <div key={r.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ background: typeBg[r.record_type] || '#f3f4f6', color: typeColor[r.record_type] || '#4b5563', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  {typeLabel[r.record_type] || r.record_type}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.record_date}</div>
                  <DeleteBtn onDelete={() => deleteRecord(r.id)} deleting={deleting === r.id} />
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {r.insemination_type && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{r.insemination_type}</span>}
                {r.offspring_count && <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>👶 {r.offspring_count} yavru</span>}
                {r.offspring_gender && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{r.offspring_gender}</span>}
                {r.expected_birth_date && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>📅 Tahmini: {r.expected_birth_date}</span>}
                {r.bull_ear_tag && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>🐂 {r.bull_ear_tag}</span>}
              </div>
              {r.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>📝 {r.notes}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── HAREKETLER ────────────────────────────────────────────────────────────────
function MovementsTab({ animalId }: { animalId: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [form, setForm] = useState({ movement_type: 'giris', movement_date: '', from_location: '', to_location: '', from_ikn: '', to_ikn: '', transport_company: '', plate_no: '', movement_reason: '', vet_health_report: '', notes: '' })

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('animal_movements').select('*').eq('animal_id', animalId).order('movement_date', { ascending: false })
    setData(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [animalId])

  const save = async () => {
    if (!form.movement_date || !form.movement_type) return alert('Tarih ve hareket türü zorunlu!')
    setSaving(true)
    const supabase = createClient()
    await supabase.from('animal_movements').insert({ ...form, animal_id: animalId })
    await load()
    setShowForm(false)
    setForm({ movement_type: 'giris', movement_date: '', from_location: '', to_location: '', from_ikn: '', to_ikn: '', transport_company: '', plate_no: '', movement_reason: '', vet_health_report: '', notes: '' })
    setSaving(false)
  }

  const deleteRecord = async (id: string) => {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('animal_movements').delete().eq('id', id)
    setData(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const typeIcons: Record<string, string> = { giris: '📥', cikis: '📤', dogum: '🐣', olum: '💀', kayip: '❓', kesim: '🔪' }
  const typeBg: Record<string, string> = { giris: '#f0fdf4', cikis: '#fef3c7', dogum: '#e0f2fe', olum: '#fef2f2', kayip: '#f5f3ff', kesim: '#fef2f2' }
  const typeColor: Record<string, string> = { giris: '#16a34a', cikis: '#d97706', dogum: '#0369a1', olum: '#dc2626', kayip: '#7c3aed', kesim: '#dc2626' }

  if (loading) return <div style={{ padding: 20, color: '#9ca3af', textAlign: 'center' }}>Yükleniyor…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: '#1a2e1a' }}>🚛 Hareket Kayıtları ({data.length})</div>
        <button onClick={() => setShowForm(s => !s)} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          {showForm ? '✕ İptal' : '+ Ekle'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f8fdf8', border: '1px solid #d1fae5', borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Hareket Türü *</label>
              <select value={form.movement_type} onChange={e => setForm(f => ({ ...f, movement_type: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}>
                {['giris','cikis','dogum','olum','kayip','kesim'].map(o => <option key={o} value={o}>{typeIcons[o]} {o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>Tarih *</label>
              <input type="date" value={form.movement_date} onChange={e => setForm(f => ({ ...f, movement_date: e.target.value }))}
                style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            {[['from_location','Kaynak Lokasyon','text'],['to_location','Hedef Lokasyon','text'],['from_ikn','Kaynak IKN','text'],['to_ikn','Hedef IKN','text'],['transport_company','Nakliyeci','text'],['plate_no','Araç Plakası','text'],['vet_health_report','Vet. Sağlık Rapor No','text'],['movement_reason','Hareket Nedeni','text']].map(([k,lbl,t]) => (
              <div key={k}>
                <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'block', marginBottom: 3 }}>{lbl}</label>
                <input type={t} value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} style={{ marginTop: 10, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      )}

      {data.length === 0 ? <EmptyState icon="🚛" text="Hareket kaydı yok" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map(m => (
            <div key={m.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ background: typeBg[m.movement_type] || '#f3f4f6', color: typeColor[m.movement_type] || '#4b5563', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  {typeIcons[m.movement_type]} {m.movement_type.charAt(0).toUpperCase() + m.movement_type.slice(1)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.movement_date}</div>
                  <DeleteBtn onDelete={() => deleteRecord(m.id)} deleting={deleting === m.id} />
                </div>
              </div>
              {(m.from_location || m.to_location) && (
                <div style={{ fontSize: 12, color: '#374151', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {m.from_location && <span>📍 {m.from_location}</span>}
                  {m.from_location && m.to_location && <span style={{ color: '#9ca3af' }}>→</span>}
                  {m.to_location && <span>📍 {m.to_location}</span>}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {m.vet_health_report && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>📋 VSR: {m.vet_health_report}</span>}
                {m.plate_no && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>🚗 {m.plate_no}</span>}
                {m.transport_company && <span style={{ background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{m.transport_company}</span>}
              </div>
              {m.movement_reason && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>📝 {m.movement_reason}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ANA SAYFA ─────────────────────────────────────────────────────────────────
export default function AnimalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [animal, setAnimal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'health' | 'milk' | 'repro' | 'move' | 'photos'>('info')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('animals').select('*').eq('id', params.id).single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setAnimal(data)
        setLoading(false)
      })
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>🐄</div><div style={{ color: '#2D6A4F', fontWeight: 700 }}>Yükleniyor…</div></div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 60 }}>🔍</div>
        <h2 style={{ color: '#1a2e1a' }}>Hayvan Bulunamadı</h2>
        <button onClick={() => router.push('/dashboard')} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>← Dashboard'a Dön</button>
      </div>
    </div>
  )

  const cfg = S[animal.status] || S.active
  const age = calcAge(animal.birth_date)
  const tabs = [
    { key: 'info',   icon: '📋', label: 'Genel' },
    { key: 'photos', icon: '📷', label: 'Fotoğraflar' },
    { key: 'health', icon: '🏥', label: 'Sağlık' },
    { key: 'milk',   icon: '🥛', label: 'Süt/Verim' },
    { key: 'repro',  icon: '🐣', label: 'Üreme' },
    { key: 'move',   icon: '🚛', label: 'Hareketler' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', fontFamily: 'Nunito, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '0 4px', color: '#2D6A4F' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: '#1a2e1a' }}>{animal.ear_tag_no || animal.animal_code}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{animal.breed} · {animal.species === 'buyukbas' ? 'Büyükbaş' : 'Küçükbaş'}</div>
        </div>
        <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>{cfg.label}</span>
      </div>

      {/* Hayvan özet kartı */}
      <div style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', padding: '20px 16px 28px', color: 'white' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {animal.photo_url && (
            <img src={animal.photo_url} alt="" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{animal.ear_tag_no}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>{animal.animal_code}</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              {animal.weight_kg && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900 }}>{animal.weight_kg}</div><div style={{ fontSize: 10, opacity: 0.7 }}>KG</div></div>}
              {age && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 900 }}>{age.y > 0 ? `${age.y}y` : ''}{age.m}a</div><div style={{ fontSize: 10, opacity: 0.7 }}>YAŞ</div></div>}
              {animal.city && <div style={{ textAlign: 'center' }}><div style={{ fontSize: 16, fontWeight: 900 }}>{animal.city}</div><div style={{ fontSize: 10, opacity: 0.7 }}>ŞEHİR</div></div>}
            </div>
          </div>
        </div>
      </div>

      {/* Tablar */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            style={{ flex: '0 0 auto', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800,
              color: activeTab === t.key ? '#2D6A4F' : '#9ca3af',
              borderBottom: activeTab === t.key ? '2px solid #2D6A4F' : '2px solid transparent',
              whiteSpace: 'nowrap' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab içeriği */}
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 80px' }}>

      {/* DÜZENLEME MODALI */}
      {isEditing && editForm && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setIsEditing(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
          <div style={{ background: 'white', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#1a2e1a' }}>✏️ Hayvanı Düzenle</div>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            {[
              { label: 'Küpe No', field: 'ear_tag_no' }, { label: '2. Küpe No', field: 'ear_tag_no_2' },
              { label: 'Chip No', field: 'chip_no' }, { label: 'TÜRKVet No', field: 'turkvet_no' },
              { label: 'Pasaport No', field: 'pasaport_no' }, { label: 'IKN', field: 'ikn' },
              { label: 'Irk', field: 'breed' }, { label: 'Doğum Tarihi', field: 'birth_date', type: 'date' },
              { label: 'Ağırlık (kg)', field: 'weight_kg', type: 'number' }, { label: 'Tahmini Kesim Ağırlığı', field: 'est_slaughter_weight', type: 'number' },
              { label: 'Şehir', field: 'city' }, { label: 'İlçe', field: 'district' },
            ].map(({ label, field, type }) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>
                <input type={type || 'text'} value={editForm[field] || ''} onChange={e => setEditForm((p: any) => ({ ...p, [field]: e.target.value }))}
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Tür</label>
              <select value={editForm.species || ''} onChange={e => setEditForm((p: any) => ({ ...p, species: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>
                <option value="buyukbas">Büyükbaş</option><option value="kucukbas">Küçükbaş</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Cinsiyet</label>
              <select value={editForm.gender || ''} onChange={e => setEditForm((p: any) => ({ ...p, gender: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>
                <option value="erkek">Erkek</option><option value="disi">Dişi</option>
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Durum</label>
              <select value={editForm.status || ''} onChange={e => setEditForm((p: any) => ({ ...p, status: e.target.value }))}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'Nunito, sans-serif' }}>
                <option value="active">Aktif</option><option value="reserved">Rezerve</option><option value="sold">Satıldı</option>
                <option value="slaughtered">Kesildi</option><option value="dead">Öldü</option><option value="archived">Arşiv</option>
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Sağlık Notları</label>
              <textarea value={editForm.health_notes || ''} onChange={e => setEditForm((p: any) => ({ ...p, health_notes: e.target.value }))}
                rows={3} style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'Nunito, sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button disabled={saving} onClick={async () => {
              setSaving(true)
              const supabase = (await import('@/lib/supabase')).createClient()
              const { data, error } = await supabase.from('animals').update({
                ear_tag_no: editForm.ear_tag_no, ear_tag_no_2: editForm.ear_tag_no_2,
                chip_no: editForm.chip_no, turkvet_no: editForm.turkvet_no,
                pasaport_no: editForm.pasaport_no, ikn: editForm.ikn,
                breed: editForm.breed, birth_date: editForm.birth_date,
                weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null,
                est_slaughter_weight: editForm.est_slaughter_weight ? parseFloat(editForm.est_slaughter_weight) : null,
                city: editForm.city, district: editForm.district,
                species: editForm.species, gender: editForm.gender,
                status: editForm.status, health_notes: editForm.health_notes,
              }).eq('id', animal.id).select().single()
              if (!error && data) { setAnimal(data); setIsEditing(false) }
              setSaving(false)
            }} style={{ width: '100%', background: saving ? '#9ca3af' : '#2D6A4F', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? '⏳ Kaydediliyor…' : '💾 Kaydet'}
            </button>
          </div>
        </div>
      )}

        {/* Genel Bilgiler */}
        {activeTab === 'info' && (
          <div>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 800, color: '#2D6A4F', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🐄 Kimlik Bilgileri</div>
              <Field label="Küpe No" value={animal.ear_tag_no} />
              <Field label="2. Küpe No" value={animal.ear_tag_no_2} />
              <Field label="Chip No" value={animal.chip_no} />
              <Field label="Sistem Kodu" value={animal.animal_code} />
              <Field label="TÜRKVet No" value={animal.turkvet_no} />
              <Field label="Pasaport No" value={animal.pasaport_no} />
              <Field label="IKN" value={animal.ikn} />
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 800, color: '#2D6A4F', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🧬 Biyolojik Bilgiler</div>
              <Field label="Tür" value={animal.species === 'buyukbas' ? 'Büyükbaş' : 'Küçükbaş'} />
              <Field label="Irk" value={animal.breed} />
              <Field label="Cinsiyet" value={animal.gender === 'erkek' ? 'Erkek' : 'Dişi'} />
              <Field label="Doğum Tarihi" value={animal.birth_date} />
              <Field label="Doğum Tipi" value={animal.birth_type} />
              <Field label="Ağırlık" value={animal.weight_kg ? `${animal.weight_kg} kg` : null} />
              <Field label="Tahmini Kesim Ağırlığı" value={animal.est_slaughter_weight ? `${animal.est_slaughter_weight} kg` : null} />
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 800, color: '#2D6A4F', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🌳 Soyağacı</div>
              <Field label="Anne Küpe No" value={animal.dame_ear_tag} />
              <Field label="Baba Küpe No" value={animal.sire_ear_tag} />
              <Field label="Soy Kütüğü Sınıfı" value={animal.stud_book_class} />
            </div>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, border: '1px solid #e5e7eb' }}>
              <div style={{ fontWeight: 800, color: '#2D6A4F', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Notlar</div>
              {animal.health_notes && <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}><span style={{ fontWeight: 700 }}>Sağlık: </span>{animal.health_notes}</div>}
              {animal.vaccination_notes && <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}><span style={{ fontWeight: 700 }}>Aşı: </span>{animal.vaccination_notes}</div>}
              {!animal.health_notes && !animal.vaccination_notes && <div style={{ color: '#9ca3af', fontSize: 13 }}>Not yok</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => router.push(`/scan/${animal.id}`)} style={{ flex: 1, background: 'white', border: '1px solid #2D6A4F', color: '#2D6A4F', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                📱 QR Sayfası
              </button>
              <button onClick={() => { setEditForm({...animal}); setIsEditing(true) }} style={{ flex: 1, background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                ✏️ Düzenle
              </button>
            </div>
          </div>
        )}

        {activeTab === 'photos' && <PhotosTab animalId={params.id} coverPhotoUrl={animal.photo_url || animal.cover_photo_url} />}
        {activeTab === 'health' && <HealthTab animalId={params.id} />}
        {activeTab === 'milk'  && <MilkTab   animalId={params.id} />}
        {activeTab === 'repro' && <ReproductionTab animalId={params.id} />}
        {activeTab === 'move'  && <MovementsTab animalId={params.id} />}
      </div>
    </div>
  )
}
