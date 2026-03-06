// components/animal/AnimalForm.tsx
'use client'

import { useState, useRef } from 'react'
import {
  AnimalFormData, AnimalSpecies, AnimalGender,
  BUYUKBAS_BREEDS, KUCUKBAS_BREEDS, TURKISH_CITIES,
  MEDIA_VIEW_LABELS, MediaViewLabel
} from '../../types'
import { createAnimal, uploadAnimalPhoto } from '../../lib/animals'

const STEPS = ['Genel Bilgi', 'Fiziksel', 'Konum', 'Fotoğraflar', 'Özet']

const PHOTO_SLOTS: { label: MediaViewLabel; tr: string; required: boolean; icon: string }[] = [
  { label: 'front',  tr: 'Ön Görünüm',     required: true,  icon: '🐄' },
  { label: 'side',   tr: 'Yan Görünüm',     required: true,  icon: '↔️' },
  { label: 'teeth',  tr: 'Diş',            required: true,  icon: '🦷' },
  { label: 'tail',   tr: 'Kuyruk',          required: true,  icon: '🔚' },
  { label: 'body',   tr: 'Genel Vücut',     required: true,  icon: '📸' },
  { label: 'other',  tr: 'Ek Fotoğraf 1',  required: false, icon: '➕' },
  { label: 'other',  tr: 'Ek Fotoğraf 2',  required: false, icon: '➕' },
  { label: 'other',  tr: 'Ek Fotoğraf 3',  required: false, icon: '➕' },
  { label: 'other',  tr: 'Ek Fotoğraf 4',  required: false, icon: '➕' },
  { label: 'other',  tr: 'Ek Fotoğraf 5',  required: false, icon: '➕' },
]

interface Props {
  ownerId: string
  onSuccess: (animalId: string) => void
  onCancel: () => void
}

export default function AnimalForm({ ownerId, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<(File | null)[]>(Array(10).fill(null))
  const [photoPreviews, setPhotoPreviews] = useState<(string | null)[]>(Array(10).fill(null))
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  const [form, setForm] = useState<AnimalFormData>({
    ear_tag_no: '',
    chip_no: '',
    species: 'buyukbas',
    breed: '',
    gender: 'erkek',
    birth_date: '',
    weight_kg: undefined,
    est_slaughter_weight: undefined,
    city: '',
    district: '',
    health_notes: '',
    vaccination_notes: ''
  })

  const breeds = form.species === 'buyukbas' ? BUYUKBAS_BREEDS : KUCUKBAS_BREEDS

  const update = (field: keyof AnimalFormData, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handlePhotoChange = (index: number, file: File | null) => {
    if (!file) return
    const newPhotos = [...photos]
    const newPreviews = [...photoPreviews]
    newPhotos[index] = file
    newPreviews[index] = URL.createObjectURL(file)
    setPhotos(newPhotos)
    setPhotoPreviews(newPreviews)
  }

  const removePhoto = (index: number) => {
    const newPhotos = [...photos]
    const newPreviews = [...photoPreviews]
    newPhotos[index] = null
    newPreviews[index] = null
    setPhotos(newPhotos)
    setPhotoPreviews(newPreviews)
  }

  const requiredPhotosFilled = photos.slice(0, 5).filter(Boolean).length >= 1

  const canProceed = () => {
    switch (step) {
      case 0: return form.ear_tag_no && form.species && form.breed && form.gender && form.birth_date
      case 1: return true
      case 2: return form.city && form.district
      case 3: return requiredPhotosFilled
      default: return true
    }
  }

  const calculateAge = () => {
    if (!form.birth_date) return ''
    const birth = new Date(form.birth_date)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    const years = Math.floor(months / 12)
    const rem = months % 12
    return years > 0 ? `${years} yıl ${rem} ay` : `${months} ay`
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const animal = await createAnimal(form, ownerId)

      // Upload photos
      const uploadPromises = photos
        .map((file, i) => ({ file, slot: PHOTO_SLOTS[i], index: i }))
        .filter(({ file }) => file !== null)
        .map(({ file, slot, index }) =>
          uploadAnimalPhoto(animal.id, file!, slot.label, index)
        )

      await Promise.all(uploadPromises)
      onSuccess(animal.id)
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mandiram-form">
      {/* Progress Bar */}
      <div className="form-progress">
        {STEPS.map((s, i) => (
          <div key={i} className={`step-dot ${i <= step ? 'active' : ''} ${i < step ? 'done' : ''}`}>
            <span className="step-num">{i < step ? '✓' : i + 1}</span>
            <span className="step-label">{s}</span>
          </div>
        ))}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Step Content */}
      <div className="form-body">

        {/* STEP 0: Genel Bilgi */}
        {step === 0 && (
          <div className="form-step">
            <h2>🐄 Genel Bilgiler</h2>
            <div className="field-group">
              <label>Küpe Numarası <span className="req">*</span></label>
              <input
                type="text"
                placeholder="TR-34-2024-000001"
                value={form.ear_tag_no}
                onChange={e => update('ear_tag_no', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Çip Numarası <span className="opt">(opsiyonel)</span></label>
              <input
                type="text"
                placeholder="123456789012345"
                value={form.chip_no}
                onChange={e => update('chip_no', e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Tür <span className="req">*</span></label>
                <select value={form.species} onChange={e => { update('species', e.target.value); update('breed', '') }}>
                  <option value="buyukbas">🐄 Büyükbaş</option>
                  <option value="kucukbas">🐑 Küçükbaş</option>
                </select>
              </div>
              <div className="field-group">
                <label>Cinsiyet <span className="req">*</span></label>
                <select value={form.gender} onChange={e => update('gender', e.target.value)}>
                  <option value="erkek">♂ Erkek</option>
                  <option value="disi">♀ Dişi</option>
                </select>
              </div>
            </div>
            <div className="field-group">
              <label>Irk <span className="req">*</span></label>
              <select value={form.breed} onChange={e => update('breed', e.target.value)}>
                <option value="">Irk seçin...</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>Doğum Tarihi <span className="req">*</span></label>
                <input type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="field-group">
                <label>Hesaplanan Yaş</label>
                <input type="text" value={calculateAge()} readOnly className="readonly" placeholder="Doğum tarihi giriniz" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Fiziksel */}
        {step === 1 && (
          <div className="form-step">
            <h2>⚖️ Fiziksel Bilgiler</h2>
            <div className="field-row">
              <div className="field-group">
                <label>Canlı Ağırlık (kg)</label>
                <input type="number" placeholder="450" min="0" max="2000" step="0.5" value={form.weight_kg || ''} onChange={e => update('weight_kg', parseFloat(e.target.value) || undefined)} />
              </div>
              <div className="field-group">
                <label>Tahmini Kesim Ağırlığı (kg)</label>
                <input type="number" placeholder="250" min="0" max="1000" step="0.5" value={form.est_slaughter_weight || ''} onChange={e => update('est_slaughter_weight', parseFloat(e.target.value) || undefined)} />
              </div>
            </div>
            <div className="field-group">
              <label>Sağlık Notları</label>
              <textarea
                placeholder="Hayvanın sağlık geçmişi, hastalık bilgileri..."
                rows={4}
                value={form.health_notes}
                onChange={e => update('health_notes', e.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Aşı Notları</label>
              <textarea
                placeholder="Yapılan aşılar, tarihler, bir sonraki aşı..."
                rows={4}
                value={form.vaccination_notes}
                onChange={e => update('vaccination_notes', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 2: Konum */}
        {step === 2 && (
          <div className="form-step">
            <h2>📍 Konum Bilgileri</h2>
            <div className="field-group">
              <label>Şehir <span className="req">*</span></label>
              <select value={form.city} onChange={e => update('city', e.target.value)}>
                <option value="">Şehir seçin...</option>
                {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>İlçe <span className="req">*</span></label>
              <input
                type="text"
                placeholder="İlçe adını girin"
                value={form.district}
                onChange={e => update('district', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Fotoğraflar */}
        {step === 3 && (
          <div className="form-step">
            <h2>📷 Fotoğraflar</h2>
            <p className="hint">İlk 5 fotoğraf önerilen alanlar. En az 1 fotoğraf ekleyin.</p>
            <div className="photo-grid">
              {PHOTO_SLOTS.map((slot, i) => (
                <div key={i} className={`photo-slot ${photos[i] ? 'filled' : ''} ${slot.required ? 'required-slot' : ''}`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    ref={el => { fileRefs.current[i] = el }}
                    onChange={e => handlePhotoChange(i, e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                  {photoPreviews[i] ? (
                    <div className="photo-preview">
                      <img src={photoPreviews[i]!} alt={slot.tr} />
                      <button className="remove-photo" onClick={() => removePhoto(i)}>✕</button>
                      <span className="photo-label">{slot.tr}</span>
                    </div>
                  ) : (
                    <button className="photo-add-btn" onClick={() => fileRefs.current[i]?.click()}>
                      <span className="slot-icon">{slot.icon}</span>
                      <span className="slot-name">{slot.tr}</span>
                      {slot.required && <span className="req-badge">Önerilen</span>}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Özet */}
        {step === 4 && (
          <div className="form-step">
            <h2>✅ Kayıt Özeti</h2>
            <div className="summary-card">
              <div className="summary-section">
                <h3>Kimlik Bilgileri</h3>
                <div className="summary-row"><span>Küpe No</span><strong>{form.ear_tag_no}</strong></div>
                {form.chip_no && <div className="summary-row"><span>Çip No</span><strong>{form.chip_no}</strong></div>}
                <div className="summary-row"><span>Tür</span><strong>{form.species === 'buyukbas' ? 'Büyükbaş' : 'Küçükbaş'}</strong></div>
                <div className="summary-row"><span>Irk</span><strong>{form.breed}</strong></div>
                <div className="summary-row"><span>Cinsiyet</span><strong>{form.gender === 'erkek' ? 'Erkek' : 'Dişi'}</strong></div>
                <div className="summary-row"><span>Doğum Tarihi</span><strong>{form.birth_date}</strong></div>
                <div className="summary-row"><span>Yaş</span><strong>{calculateAge()}</strong></div>
              </div>
              {(form.weight_kg || form.est_slaughter_weight) && (
                <div className="summary-section">
                  <h3>Fiziksel</h3>
                  {form.weight_kg && <div className="summary-row"><span>Ağırlık</span><strong>{form.weight_kg} kg</strong></div>}
                  {form.est_slaughter_weight && <div className="summary-row"><span>Tahmini Kesim</span><strong>{form.est_slaughter_weight} kg</strong></div>}
                </div>
              )}
              <div className="summary-section">
                <h3>Konum</h3>
                <div className="summary-row"><span>Şehir / İlçe</span><strong>{form.city} / {form.district}</strong></div>
              </div>
              <div className="summary-section">
                <h3>Fotoğraflar</h3>
                <div className="summary-row"><span>Yüklenen</span><strong>{photos.filter(Boolean).length} fotoğraf</strong></div>
                <div className="photo-thumb-row">
                  {photoPreviews.filter(Boolean).map((src, i) => (
                    <img key={i} src={src!} alt="" className="thumb" />
                  ))}
                </div>
              </div>
            </div>
            {error && <div className="error-banner">⚠️ {error}</div>}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="form-nav">
        <button className="btn-secondary" onClick={step === 0 ? onCancel : () => setStep(s => s - 1)}>
          {step === 0 ? 'İptal' : '← Geri'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            className="btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed()}
          >
            İleri →
          </button>
        ) : (
          <button
            className="btn-success"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '⏳ Kaydediliyor...' : '✅ Kaydı Tamamla'}
          </button>
        )}
      </div>

      <style>{`
        .mandiram-form {
          max-width: 640px;
          margin: 0 auto;
          font-family: 'Nunito', sans-serif;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 32px rgba(45,106,79,0.12);
          overflow: hidden;
        }
        .form-progress {
          background: #2D6A4F;
          padding: 20px 24px 0;
          display: flex;
          gap: 0;
          position: relative;
          justify-content: space-between;
        }
        .progress-bar {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 3px;
          background: rgba(255,255,255,0.2);
        }
        .progress-fill {
          height: 100%;
          background: #52B788;
          transition: width 0.4s ease;
        }
        .step-dot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: default;
          opacity: 0.5;
          padding-bottom: 16px;
          transition: opacity 0.3s;
        }
        .step-dot.active { opacity: 1; }
        .step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
        }
        .step-dot.active .step-num { background: #52B788; }
        .step-dot.done .step-num { background: #40916C; }
        .step-label {
          font-size: 10px;
          color: rgba(255,255,255,0.9);
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .form-body { padding: 28px 28px 12px; }
        .form-step h2 {
          font-size: 20px;
          font-weight: 800;
          color: #1a3d2b;
          margin: 0 0 20px;
        }
        .field-group { margin-bottom: 16px; }
        .field-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          margin-bottom: 6px;
        }
        .req { color: #ef4444; }
        .opt { color: #9ca3af; font-weight: 400; font-size: 11px; }
        .field-group input, .field-group select, .field-group textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #d1fae5;
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          color: #111;
          background: #f8faf8;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .field-group input:focus, .field-group select:focus, .field-group textarea:focus {
          outline: none;
          border-color: #52B788;
          box-shadow: 0 0 0 3px rgba(82,183,136,0.15);
        }
        .readonly { background: #f0f7f4 !important; cursor: default; color: #2D6A4F; font-weight: 600; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .hint { font-size: 13px; color: #6b7280; margin: -8px 0 16px; }
        .photo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media(min-width: 480px) { .photo-grid { grid-template-columns: repeat(3, 1fr); } }
        .photo-slot {
          aspect-ratio: 1;
          border-radius: 12px;
          overflow: hidden;
          border: 2px dashed #d1fae5;
          background: #f8faf8;
          transition: border-color 0.2s;
        }
        .photo-slot.required-slot { border-color: #86efac; }
        .photo-slot.filled { border: 2px solid #52B788; }
        .photo-add-btn {
          width: 100%; height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        .photo-add-btn:hover { background: #f0fdf4; }
        .slot-icon { font-size: 22px; }
        .slot-name { font-size: 10px; font-weight: 700; color: #374151; text-align: center; }
        .req-badge {
          font-size: 9px;
          background: #dcfce7;
          color: #16a34a;
          padding: 2px 6px;
          border-radius: 20px;
          font-weight: 700;
        }
        .photo-preview {
          position: relative;
          width: 100%; height: 100%;
        }
        .photo-preview img {
          width: 100%; height: 100%;
          object-fit: cover;
        }
        .remove-photo {
          position: absolute;
          top: 4px; right: 4px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px; height: 20px;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .photo-label {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: rgba(0,0,0,0.5);
          color: white;
          font-size: 9px;
          text-align: center;
          padding: 3px;
          font-weight: 700;
        }
        .summary-card { background: #f8faf8; border-radius: 12px; padding: 20px; border: 1.5px solid #d1fae5; }
        .summary-section { margin-bottom: 16px; }
        .summary-section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; margin: 0 0 8px; }
        .summary-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #e7f3ee; font-size: 14px; }
        .summary-row span { color: #6b7280; }
        .summary-row strong { color: #1a3d2b; }
        .photo-thumb-row { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .thumb { width: 44px; height: 44px; border-radius: 6px; object-fit: cover; }
        .error-banner {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          margin-top: 12px;
          font-size: 13px;
        }
        .form-nav {
          padding: 16px 28px 24px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          border-top: 1.5px solid #f0fdf4;
        }
        .btn-secondary {
          padding: 10px 20px;
          border: 1.5px solid #d1fae5;
          background: white;
          color: #374151;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .btn-secondary:hover { background: #f0fdf4; }
        .btn-primary {
          padding: 10px 28px;
          background: #2D6A4F;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-primary:hover:not(:disabled) { background: #1b4332; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-success {
          padding: 10px 28px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .btn-success:hover:not(:disabled) { background: #15803d; }
        .btn-success:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </div>
  )
}
