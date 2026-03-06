'use client'
// components/dashboard/AddAnimalModal.tsx — v1.1 Zengin Form

import { useState, useRef, useEffect } from "react"
import { uploadAnimalPhoto } from "@/lib/uploadPhoto"
import { createClient } from "@/lib/supabase"
import { BUYUKBAS_BREEDS, KUCUKBAS_BREEDS, TURKISH_CITIES } from "@/types_v1.1"

function generateCode(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(10000 + Math.random() * 90000)
  return `MND-${year}-${rand}`
}

const initialForm = {
  animal_code:          generateCode(),
  name:                 "",
  species:              "buyukbas",
  breed:                "",
  gender:               "erkek",
  birth_date:           "",
  birth_type:           "",
  weight_kg:            "",
  est_slaughter_weight: "",
  city:                 "",
  district:             "",
  status:               "active",
  ear_tag_no:           "",
  ear_tag_no_2:         "",
  chip_no:              "",
  turkvet_no:           "",
  turkvet_kullanici_no: "",
  turkvet_bildiri_no:   "",
  pasaport_no:          "",
  ikn:                  "",
  anne_kupe_no:         "",
  baba_kupe_no:         "",
  anne_irki:            "",
  baba_irki:            "",
  soy_kutugu_sinifi:    "",
  health_notes:         "",
  vaccination_notes:    "",
  general_notes:        "",
}

type FormState = typeof initialForm

export default function AddAnimalModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (animal: any) => Promise<void>
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const [chipStatus, setChipStatus] = useState<'idle' | 'valid' | 'invalid' | 'duplicate' | 'checking'>('idle')
  const [chipError, setChipError] = useState<string>('')
  const [showScanner, setShowScanner] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)

  const set = (field: keyof FormState, val: string) =>
    setForm(p => ({ ...p, [field]: val }))

  // ISO 11784/11785 chip no validasyonu
  const validateChip = async (chipNo: string) => {
    if (!chipNo || chipNo.trim() === '') { setChipStatus('idle'); setChipError(''); return }
    const clean = chipNo.replace(/\s/g, '')
    // Sadece rakam, 15 hane
    if (!/^\d{15}$/.test(clean)) {
      setChipStatus('invalid')
      setChipError("Chip no 15 haneli rakamdan olusmalı (su an " + clean.length + " hane)")
      return
    }
    setChipStatus('checking')
    setChipError('')
    // Duplicate kontrol
    const supabase = createClient()
    const { data } = await supabase.from('animals').select('id, ear_tag_no').eq('chip_no', clean).maybeSingle()
    if (data) {
      setChipStatus('duplicate')
      setChipError('\u26a0\ufe0f Bu chip no zaten kayitli - Kupe: ' + (data.ear_tag_no || data.id))
    } else {
      setChipStatus('valid')
      setChipError('')
    }
  }

  const breeds = form.species === "buyukbas" ? BUYUKBAS_BREEDS : KUCUKBAS_BREEDS

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert("Fotoğraf 10MB'dan küçük olmalı!"); return }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setErrorMsg(null)
    if (!form.ear_tag_no.trim()) { setErrorMsg("❌ Küpe numarası zorunlu!"); return }
    if (!form.breed) { setErrorMsg("❌ Irk seçimi zorunlu!"); return }
    setSaving(true)
    try {
      let cover_photo_url: string | null = null
      if (photoFile) {
        setUploadProgress(true)
        cover_photo_url = await uploadAnimalPhoto(photoFile, form.animal_code)
        setUploadProgress(false)
        if (!cover_photo_url) setErrorMsg("⚠️ Fotoğraf yüklenemedi ama hayvan kaydedilecek.")
      }
      await onAdd({
        ...form,
        weight_kg:            form.weight_kg            ? parseFloat(form.weight_kg)            : null,
        est_slaughter_weight: form.est_slaughter_weight ? parseFloat(form.est_slaughter_weight) : null,
        birth_date:           form.birth_date           ? form.birth_date                       : null,
        cover_photo_url,
      })
    } catch (err: any) {
      setErrorMsg("Hata: " + (err?.message || "Bilinmeyen hata"))
    } finally {
      setSaving(false)
      setUploadProgress(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 11px", border: "1.5px solid #d1fae5",
    borderRadius: 9, fontSize: 13, fontFamily: "inherit", outline: "none",
    background: "white", color: "#1a3d2b", fontWeight: 600, boxSizing: "border-box",
  }
  const lbl = (text: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 5 }}>{text}</div>
  )
  const inp = (field: keyof FormState, placeholder = "", type = "text") => (
    <input type={type} value={form[field]} onChange={e => set(field, e.target.value)} placeholder={placeholder} style={inputStyle} />
  )
  const sel = (field: keyof FormState, options: { value: string; label: string }[]) => (
    <select value={form[field]} onChange={e => set(field, e.target.value)} style={inputStyle}>
      <option value="">Seçiniz</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  const TABS = [
    { id: 1, label: "Temel Bilgiler", icon: "🐄" },
    { id: 2, label: "Kimlik & TÜRKVet", icon: "🏷️" },
    { id: 3, label: "Soyağacı & Notlar", icon: "🌳" },
  ] as const

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "93vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg, #1b4332, #2D6A4F)", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ color: "white", fontWeight: 900, fontSize: 17 }}>🐄 Yeni Hayvan Ekle</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2 }}>{form.animal_code}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: 30, height: 30, fontSize: 14, cursor: "pointer" }}>✕</button>
        </div>

        {/* Sekmeler */}
        <div style={{ display: "flex", borderBottom: "1.5px solid #e7f3ee", flexShrink: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setStep(tab.id)} style={{
              flex: 1, padding: "10px 4px", background: step === tab.id ? "#f0fdf4" : "white",
              border: "none", borderBottom: `2.5px solid ${step === tab.id ? "#2D6A4F" : "transparent"}`,
              fontSize: 11, fontWeight: 800, color: step === tab.id ? "#2D6A4F" : "#9ca3af",
              cursor: "pointer", fontFamily: "inherit", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* İçerik */}
        <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
          {errorMsg && (
            <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, fontWeight: 700, color: "#dc2626" }}>
              {errorMsg}
            </div>
          )}

          {/* SEKME 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                {lbl("📷 Kapak Fotoğrafı")}
                <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #d1fae5", borderRadius: 12, height: 110, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", background: "#f8fdf9", position: "relative" }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ textAlign: "center", color: "#9ca3af" }}>
                        <div style={{ fontSize: 24, marginBottom: 4 }}>📷</div>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>Fotoğraf seç (max 10MB)</div>
                      </div>
                  }
                  {photoPreview && (
                    <button onClick={e => { e.stopPropagation(); setPhotoFile(null); setPhotoPreview(null) }}
                      style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.5)", border: "none", color: "white", borderRadius: "50%", width: 22, height: 22, fontSize: 11, cursor: "pointer" }}>✕</button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  {lbl("İsim (opsiyonel)")}
                  {inp("name", "Sarıkız, Boğa123...")}
                </div>
                <div>
                  {lbl("Tür *")}
                  <select value={form.species} onChange={e => { set("species", e.target.value); set("breed", "") }} style={inputStyle}>
                    <option value="buyukbas">🐄 Büyükbaş</option>
                    <option value="kucukbas">🐑 Küçükbaş</option>
                  </select>
                </div>
                <div>
                  {lbl("Irk *")}
                  <select value={form.breed} onChange={e => set("breed", e.target.value)} style={inputStyle}>
                    <option value="">Seçiniz</option>
                    {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  {lbl("Cinsiyet *")}
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} style={inputStyle}>
                    <option value="erkek">♂ Erkek</option>
                    <option value="disi">♀ Dişi</option>
                  </select>
                </div>
                <div>
                  {lbl("Durum")}
                  {sel("status", [
                    { value: "active", label: "✅ Aktif" },
                    { value: "reserved", label: "🔒 Rezerve" },
                    { value: "sold", label: "💰 Satıldı" },
                    { value: "slaughtered", label: "🔪 Kesildi" },
                    { value: "dead", label: "💀 Öldü" },
                    { value: "lost", label: "❓ Kayıp" },
                  ])}
                </div>
                <div>
                  {lbl("Doğum Tarihi")}
                  {inp("birth_date", "", "date")}
                </div>
                <div>
                  {lbl("Doğum Tipi")}
                  {sel("birth_type", [
                    { value: "tekil", label: "Tekil" },
                    { value: "ikiz", label: "İkiz" },
                    { value: "ucuz", label: "Üçüz" },
                  ])}
                </div>
                <div>
                  {lbl("Ağırlık (kg)")}
                  {inp("weight_kg", "450", "number")}
                </div>
                <div>
                  {lbl("Tahmini Kesim Ağırlığı (kg)")}
                  {inp("est_slaughter_weight", "600", "number")}
                </div>
                <div>
                  {lbl("Şehir")}
                  <select value={form.city} onChange={e => set("city", e.target.value)} style={inputStyle}>
                    <option value="">Seçiniz</option>
                    {TURKISH_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  {lbl("İlçe")}
                  {inp("district", "İlçe adı")}
                </div>
              </div>
            </>
          )}

          {/* SEKME 2 */}
          {step === 2 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 4, fontSize: 12, color: "#166534", fontWeight: 600 }}>
                  🏷️ Küpe numaraları TÜRKVet ile senkronize edilir. Boş bırakılabilir.
                </div>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("Küpe No * (Birincil)")}
                {inp("ear_tag_no", "TR-1234567890123")}
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("Küpe No 2 (İkincil)")}
                {inp("ear_tag_no_2", "Varsa ikinci küpe")}
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("Chip No (15 hane ISO 11784/11785)")}
                <div style={{ position: 'relative' }}>
                  <input
                    value={form.chip_no}
                    onChange={e => { set("chip_no", e.target.value); setChipStatus('idle') }}
                    onBlur={e => validateChip(e.target.value)}
                    placeholder="982000123456789"
                    maxLength={15}
                    style={{
                      width: '100%', padding: '10px 80px 10px 12px', border: `1.5px solid ${chipStatus === 'valid' ? '#22c55e' : chipStatus === 'invalid' || chipStatus === 'duplicate' ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: 8, fontSize: 14, fontFamily: 'Nunito, sans-serif', boxSizing: 'border-box' as const,
                      background: chipStatus === 'valid' ? '#f0fdf4' : chipStatus === 'invalid' || chipStatus === 'duplicate' ? '#fef2f2' : 'white'
                    }}
                  />
                  {/* Sağdaki butonlar */}
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                    {chipStatus === 'checking' && <span style={{ fontSize: 16 }}>⏳</span>}
                    {chipStatus === 'valid' && <span style={{ fontSize: 16 }}>✅</span>}
                    {(chipStatus === 'invalid' || chipStatus === 'duplicate') && <span style={{ fontSize: 16 }}>❌</span>}
                    {/* 📷 Kamera barkod okuma butonu */}
                    <button type="button" onClick={() => setShowScanner(s => !s)}
                      title="Kamera ile barkod/QR oku"
                      style={{ background: showScanner ? '#2D6A4F' : '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', fontSize: 14 }}>
                      📷
                    </button>
                  </div>
                </div>
                {/* Hata / uyarı mesajı */}
                {chipError && (
                  <div style={{ fontSize: 12, marginTop: 4, color: chipStatus === 'duplicate' ? '#d97706' : '#ef4444', fontWeight: 600 }}>
                    {chipError}
                  </div>
                )}
                {chipStatus === 'valid' && (
                  <div style={{ fontSize: 12, marginTop: 4, color: '#16a34a', fontWeight: 600 }}>✅ Geçerli chip no, sistemde kayıtlı değil</div>
                )}
                {/* Kamera Scanner */}
                {showScanner && (
                  <div style={{ marginTop: 8, border: '2px dashed #2D6A4F', borderRadius: 10, padding: 12, background: '#f0fdf4' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#2D6A4F', marginBottom: 8 }}>📷 Barkod / QR Tarayıcı</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                      Chip okuyucunuzun barkod çıktısını kamerayla okutun veya aşağıdaki alana yazın:
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        id="barcode-input"
                        placeholder="Barkod okuyucuyla tarayın veya yapıştırın..."
                        autoFocus
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'Nunito, sans-serif' }}
                        onKeyDown={e => {
                          // Barkod okuyucular genellikle Enter ile bitirir
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim()
                            if (val) { set('chip_no', val); validateChip(val); setShowScanner(false) }
                          }
                        }}
                        onPaste={e => {
                          const val = e.clipboardData.getData('text').trim()
                          if (val) { setTimeout(() => { set('chip_no', val); validateChip(val); setShowScanner(false) }, 50) }
                        }}
                      />
                      <button type="button" onClick={() => {
                        const el = document.getElementById('barcode-input') as HTMLInputElement
                        if (el?.value) { set('chip_no', el.value.trim()); validateChip(el.value.trim()); setShowScanner(false) }
                      }} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        Uygula
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
                      💡 Fiziksel barkod okuyucu genellikle USB/Bluetooth ile bağlanır ve Enter tuşu gönderir. Chip no otomatik dolacaktır.
                    </div>
                  </div>
                )}
              </div>
              <div style={{ gridColumn: "1/-1", borderTop: "1px solid #d1fae5", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2D6A4F", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>
                  🇹🇷 TÜRKVet Bilgileri
                </div>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("TÜRKVet No")}
                {inp("turkvet_no", "TV-2024-XXXXXXXX")}
              </div>
              <div>
                {lbl("TÜRKVet Kullanıcı No")}
                {inp("turkvet_kullanici_no", "Kullanıcı no")}
              </div>
              <div>
                {lbl("TÜRKVet Bildiri No")}
                {inp("turkvet_bildiri_no", "Bildiri no")}
              </div>
              <div style={{ gridColumn: "1/-1", borderTop: "1px solid #d1fae5", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2D6A4F", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>
                  📄 Pasaport & İşletme
                </div>
              </div>
              <div>
                {lbl("Pasaport No")}
                {inp("pasaport_no", "Hayvan pasaport no")}
              </div>
              <div>
                {lbl("İşletme Kayıt No (IKN)")}
                {inp("ikn", "TR-34-XXXXXXX")}
              </div>
            </div>
          )}

          {/* SEKME 3 */}
          {step === 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2D6A4F", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10, borderBottom: "1px solid #d1fae5", paddingBottom: 6 }}>
                  🌳 Soyağacı
                </div>
              </div>
              <div>
                {lbl("Anne Küpe No")}
                {inp("anne_kupe_no", "Annenin küpe no")}
              </div>
              <div>
                {lbl("Baba Küpe No")}
                {inp("baba_kupe_no", "Babanın küpe no")}
              </div>
              <div>
                {lbl("Anne Irkı")}
                {inp("anne_irki", "Holstein, Simental...")}
              </div>
              <div>
                {lbl("Baba Irkı")}
                {inp("baba_irki", "Angus, Limuzin...")}
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("Soy Kütüğü Sınıfı")}
                {sel("soy_kutugu_sinifi", [
                  { value: "A", label: "A Sınıfı" },
                  { value: "B", label: "B Sınıfı" },
                  { value: "C", label: "C Sınıfı" },
                ])}
              </div>
              <div style={{ gridColumn: "1/-1", borderTop: "1px solid #d1fae5", paddingTop: 12, marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2D6A4F", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>
                  📝 Notlar
                </div>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("🏥 Sağlık Notları")}
                <textarea value={form.health_notes} onChange={e => set("health_notes", e.target.value)}
                  rows={3} placeholder="Hastalık geçmişi, ilaç, operasyon..."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("💉 Aşı Notları")}
                <textarea value={form.vaccination_notes} onChange={e => set("vaccination_notes", e.target.value)}
                  rows={3} placeholder="Şap, brucella, kuduz tarihleri..."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                {lbl("📋 Genel Notlar")}
                <textarea value={form.general_notes} onChange={e => set("general_notes", e.target.value)}
                  rows={3} placeholder="Diğer önemli bilgiler..."
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1.5px solid #e7f3ee", display: "flex", gap: 8, flexShrink: 0 }}>
          {step === 1
            ? <button onClick={onClose} style={{ padding: "10px 16px", background: "#f3f4f6", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>İptal</button>
            : <button onClick={() => setStep(s => (s - 1) as 1|2|3)} style={{ padding: "10px 16px", background: "#f3f4f6", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, color: "#6b7280", cursor: "pointer", fontFamily: "inherit" }}>← Geri</button>
          }
          {step < 3
            ? <button onClick={() => { setErrorMsg(null); setStep(s => (s + 1) as 1|2|3) }}
                style={{ flex: 1, padding: "10px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Devam →
              </button>
            : <button onClick={handleSubmit} disabled={saving}
                style={{ flex: 1, padding: "10px", background: saving ? "#9ca3af" : "#2D6A4F", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {uploadProgress ? "📤 Fotoğraf yükleniyor..." : saving ? "⏳ Kaydediliyor..." : "✅ Hayvanı Kaydet"}
              </button>
          }
        </div>

      </div>
    </div>
  )
}
