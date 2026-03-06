'use client'
// components/dashboard/AnimalDetailModal.tsx

import { useState, useRef } from "react"
import { uploadAnimalPhoto } from "@/lib/uploadPhoto"
import { BUYUKBAS_BREEDS, KUCUKBAS_BREEDS, TURKISH_CITIES } from "@/types_v1.1"

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: "Aktif",    color: "#16a34a", bg: "#f0fdf4" },
  reserved:    { label: "Rezerve", color: "#d97706", bg: "#fffbeb" },
  sold:        { label: "Satıldı", color: "#4b5563", bg: "#f9fafb" },
  slaughtered: { label: "Kesildi", color: "#dc2626", bg: "#fef2f2" },
  dead:        { label: "Öldü",    color: "#7f1d1d", bg: "#fef2f2" },
  lost:        { label: "Kayıp",   color: "#7c3aed", bg: "#f5f3ff" },
  archived:    { label: "Arşiv",   color: "#9ca3af", bg: "#f3f4f6" },
}

function calcAge(birthDate: string | null): { years: number; months: number } | null {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return null
  const now = new Date()
  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  if (months < 0) { years--; months += 12 }
  return { years, months }
}

export default function AnimalDetailModal({ animal, onClose, onStatusChange, onUpdate, showToast }: {
  animal: any
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
  onUpdate: (id: string, data: any) => Promise<void>
  showToast: (msg: string) => void
}) {
  const cfg = STATUS_CFG[animal.status] || STATUS_CFG.active
  const [isEditing, setIsEditing] = useState(false)
  const [viewTab, setViewTab] = useState<1 | 2 | 3 | 4>(1)
  const [editTab, setEditTab] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name:                 animal.name                 || "",
    species:              animal.species              || "buyukbas",
    breed:                animal.breed                || "",
    gender:               animal.gender               || "erkek",
    birth_date:           animal.birth_date           || "",
    birth_type:           animal.birth_type           || "",
    weight_kg:            animal.weight_kg            || "",
    est_slaughter_weight: animal.est_slaughter_weight || "",
    city:                 animal.city                 || "",
    district:             animal.district             || "",
    status:               animal.status               || "active",
    ear_tag_no:           animal.ear_tag_no           || "",
    ear_tag_no_2:         animal.ear_tag_no_2         || "",
    chip_no:              animal.chip_no              || "",
    turkvet_no:           animal.turkvet_no           || "",
    turkvet_kullanici_no: animal.turkvet_kullanici_no || "",
    turkvet_bildiri_no:   animal.turkvet_bildiri_no   || "",
    pasaport_no:          animal.pasaport_no          || "",
    ikn:                  animal.ikn                  || "",
    anne_kupe_no:         animal.anne_kupe_no         || "",
    baba_kupe_no:         animal.baba_kupe_no         || "",
    anne_irki:            animal.anne_irki            || "",
    baba_irki:            animal.baba_irki            || "",
    soy_kutugu_sinifi:    animal.soy_kutugu_sinifi    || "",
    health_notes:         animal.health_notes         || "",
    vaccination_notes:    animal.vaccination_notes    || "",
    general_notes:        animal.general_notes        || "",
  })

  type FormState = {
    name: string; species: string; breed: string; gender: string;
    birth_date: string; birth_type: string; weight_kg: string | number;
    est_slaughter_weight: string | number; city: string; district: string;
    status: string; ear_tag_no: string; ear_tag_no_2: string; chip_no: string;
    turkvet_no: string; turkvet_kullanici_no: string; turkvet_bildiri_no: string;
    pasaport_no: string; ikn: string; anne_kupe_no: string; baba_kupe_no: string;
    anne_irki: string; baba_irki: string; soy_kutugu_sinifi: string;
    health_notes: string; vaccination_notes: string; general_notes: string;
  }

  const set = (field: keyof FormState, val: string) =>
    setForm(p => ({ ...p, [field]: val }))

  const age = calcAge(isEditing ? form.birth_date : animal.birth_date)

  const handleSave = async () => {
    setSaving(true)
    try {
      let cover_photo_url = animal.cover_photo_url || null
      if (photoFile) {
        const url = await uploadAnimalPhoto(photoFile, animal.animal_code)
        if (url) cover_photo_url = url
      }
      await onUpdate(animal.id, {
        ...form,
        weight_kg:            form.weight_kg            ? parseFloat(String(form.weight_kg))            : null,
        est_slaughter_weight: form.est_slaughter_weight ? parseFloat(String(form.est_slaughter_weight)) : null,
        cover_photo_url,
      })
      setIsEditing(false)
      setPhotoFile(null)
      setPhotoPreview(null)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm({
      name:                 animal.name                 || "",
      species:              animal.species              || "buyukbas",
      breed:                animal.breed                || "",
      gender:               animal.gender               || "erkek",
      birth_date:           animal.birth_date           || "",
      birth_type:           animal.birth_type           || "",
      weight_kg:            animal.weight_kg            || "",
      est_slaughter_weight: animal.est_slaughter_weight || "",
      city:                 animal.city                 || "",
      district:             animal.district             || "",
      status:               animal.status               || "active",
      ear_tag_no:           animal.ear_tag_no           || "",
      ear_tag_no_2:         animal.ear_tag_no_2         || "",
      chip_no:              animal.chip_no              || "",
      turkvet_no:           animal.turkvet_no           || "",
      turkvet_kullanici_no: animal.turkvet_kullanici_no || "",
      turkvet_bildiri_no:   animal.turkvet_bildiri_no   || "",
      pasaport_no:          animal.pasaport_no          || "",
      ikn:                  animal.ikn                  || "",
      anne_kupe_no:         animal.anne_kupe_no         || "",
      baba_kupe_no:         animal.baba_kupe_no         || "",
      anne_irki:            animal.anne_irki            || "",
      baba_irki:            animal.baba_irki            || "",
      soy_kutugu_sinifi:    animal.soy_kutugu_sinifi    || "",
      health_notes:         animal.health_notes         || "",
      vaccination_notes:    animal.vaccination_notes    || "",
      general_notes:        animal.general_notes        || "",
    })
    setPhotoFile(null)
    setPhotoPreview(null)
    setIsEditing(false)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px", border: "1.5px solid #d1fae5",
    borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none",
    background: "white", color: "#1a3d2b", fontWeight: 600, boxSizing: "border-box",
  }
  const lbl = (text: string) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 4 }}>{text}</div>
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

  const breeds = form.species === "kucukbas" ? KUCUKBAS_BREEDS : BUYUKBAS_BREEDS

  const EDIT_TABS = [
    { id: 1, label: "Temel", icon: "🐄" },
    { id: 2, label: "Kimlik", icon: "🏷️" },
    { id: 3, label: "Soyağacı", icon: "🌳" },
  ] as const

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div
        style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Fotoğraf / Header */}
        <div style={{ aspectRatio: "16/7", background: `linear-gradient(135deg, ${animal.species === "buyukbas" ? "#1b4332,#2D6A4F,#52B788" : "#1e3a8a,#1D4ED8,#60A5FA"})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, position: "relative", flexShrink: 0 }}>
          {(photoPreview || animal.cover_photo_url)
            ? <img src={photoPreview || animal.cover_photo_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : (animal.species === "buyukbas" ? "🐄" : "🐑")
          }
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <span style={{ padding: "4px 12px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 12, fontWeight: 800, border: `1px solid ${cfg.color}44` }}>● {cfg.label}</span>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.3)", border: "none", color: "white", borderRadius: "50%", width: 28, height: 28, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          {isEditing && (
            <button onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 10, right: 10, background: "#2D6A4F", color: "white", border: "none", borderRadius: 10, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {photoPreview ? "✓ Değiştirildi" : "📷 Fotoğraf Değiştir"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              if (file.size > 10 * 1024 * 1024) { alert("Max 10MB!"); return }
              setPhotoFile(file)
              setPhotoPreview(URL.createObjectURL(file))
            }}
          />
        </div>

        {/* İçerik */}
        <div style={{ overflowY: "auto", padding: "20px 24px 24px", flex: 1 }}>

          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1a3d2b", margin: 0 }}>
              {animal.name ? `${animal.name} — ` : ""}{animal.breed} {animal.gender === "erkek" ? "♂" : "♀"}
            </h2>
            <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 3 }}>{animal.animal_code}</div>
          </div>

          {/* VIEW MODE — tabbed */}
          {!isEditing && (
            <>
              {/* Sekme Başlıkları */}
              <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#f0fdf4", borderRadius: 12, padding: 4 }}>
                {([
                  { id: 1, icon: "🐄", label: "Genel" },
                  { id: 2, icon: "🏷️", label: "Kimlik" },
                  { id: 3, icon: "🌳", label: "Soyağacı" },
                  { id: 4, icon: "📋", label: "Notlar" },
                ] as const).map(tab => (
                  <button key={tab.id} onClick={() => setViewTab(tab.id)} style={{
                    flex: 1, padding: "8px 4px",
                    background: viewTab === tab.id ? "white" : "transparent",
                    border: "none", borderRadius: 9,
                    fontSize: 11, fontWeight: 800,
                    color: viewTab === tab.id ? "#2D6A4F" : "#9ca3af",
                    cursor: "pointer", fontFamily: "inherit",
                    boxShadow: viewTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Sekme 1 — Genel Bilgi */}
              {viewTab === 1 && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {[
                      ["🧬 Tür",           animal.species === "buyukbas" ? "Büyükbaş" : "Küçükbaş"],
                      ["🐾 Irk",           animal.breed || "—"],
                      ["🔵 Cinsiyet",      animal.gender === "erkek" ? "♂ Erkek" : "♀ Dişi"],
                      ["📅 Doğum",         animal.birth_date || "—"],
                      ["🕐 Yaş",           age ? `${age.years} yıl ${age.months} ay` : "—"],
                      ["🐣 Doğum Tipi",    animal.birth_type || "—"],
                      ["⚖️ Ağırlık",       animal.weight_kg ? `${animal.weight_kg} kg` : "—"],
                      ["🥩 Kesim Tahmini", animal.est_slaughter_weight ? `${animal.est_slaughter_weight} kg` : "—"],
                      ["📍 İl",            animal.city || "—"],
                      ["🏘 İlçe",          animal.district || "—"],
                    ].map(([label, val], i) => (
                      <div key={i} style={{ background: "#f8fdf9", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#1a3d2b" }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Durum Güncelle */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 8 }}>Durum Güncelle</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {Object.entries(STATUS_CFG).map(([key, c]) => (
                        <button key={key} onClick={() => onStatusChange(animal.id, key)} style={{ padding: "5px 12px", borderRadius: 20, border: `1.5px solid ${animal.status === key ? c.color : "#e7f3ee"}`, background: animal.status === key ? c.bg : "white", color: animal.status === key ? c.color : "#6b7280", fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Sekme 2 — Kimlik */}
              {viewTab === 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[
                    ["🏷 Küpe No (1)",       animal.ear_tag_no || "—"],
                    ["🏷 Küpe No (2)",       animal.ear_tag_no_2 || "—"],
                    ["📡 Chip No",           animal.chip_no || "—"],
                    ["🔖 TÜRKVet No",        animal.turkvet_no || "—"],
                    ["👤 TÜRKVet Kullanıcı", animal.turkvet_kullanici_no || "—"],
                    ["📬 TÜRKVet Bildiri",   animal.turkvet_bildiri_no || "—"],
                    ["📄 Pasaport No",       animal.pasaport_no || "—"],
                    ["🏢 IKN",               animal.ikn || "—"],
                  ].map(([label, val], i) => (
                    <div key={i} style={{ background: "#f8fdf9", borderRadius: 10, padding: "10px 12px", gridColumn: i === 2 ? "1/-1" : undefined }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1a3d2b", fontFamily: i === 2 ? "monospace" : "inherit" }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sekme 3 — Soyağacı */}
              {viewTab === 3 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      ["👩 Anne Küpe", animal.anne_kupe_no || "—"],
                      ["👨 Baba Küpe", animal.baba_kupe_no || "—"],
                      ["🐄 Anne Irkı", animal.anne_irki || "—"],
                      ["🐂 Baba Irkı", animal.baba_irki || "—"],
                    ].map(([label, val], i) => (
                      <div key={i} style={{ background: "#f8fdf9", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#1a3d2b" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                  {animal.soy_kutugu_sinifi && (
                    <div style={{ background: "#fefce8", borderRadius: 10, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 3 }}>🏅 Soy Kütüğü Sınıfı</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#92400e" }}>{animal.soy_kutugu_sinifi} Sınıfı</div>
                    </div>
                  )}
                  {!animal.anne_kupe_no && !animal.baba_kupe_no && !animal.anne_irki && !animal.baba_irki && (
                    <div style={{ textAlign: "center" as const, padding: "24px 0", color: "#9ca3af", fontSize: 13 }}>
                      🌳 Soyağacı bilgisi henüz girilmemiş
                    </div>
                  )}
                </div>
              )}

              {/* Sekme 4 — Notlar */}
              {viewTab === 4 && (
                <div style={{ marginBottom: 16 }}>
                  {animal.health_notes ? (
                    <div style={{ background: "#fefce8", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 6 }}>🏥 Sağlık Notları</div>
                      <div style={{ fontSize: 13, color: "#1a3d2b", lineHeight: 1.6 }}>{animal.health_notes}</div>
                    </div>
                  ) : null}
                  {animal.vaccination_notes ? (
                    <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 6 }}>💉 Aşı Notları</div>
                      <div style={{ fontSize: 13, color: "#1a3d2b", lineHeight: 1.6 }}>{animal.vaccination_notes}</div>
                    </div>
                  ) : null}
                  {animal.general_notes ? (
                    <div style={{ background: "#f8fdf9", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" as const, marginBottom: 6 }}>📋 Genel Notlar</div>
                      <div style={{ fontSize: 13, color: "#1a3d2b", lineHeight: 1.6 }}>{animal.general_notes}</div>
                    </div>
                  ) : null}
                  {!animal.health_notes && !animal.vaccination_notes && !animal.general_notes && (
                    <div style={{ textAlign: "center" as const, padding: "24px 0", color: "#9ca3af", fontSize: 13 }}>
                      📋 Henüz not girilmemiş
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* EDIT MODE */}
          {isEditing && (
            <>
              {/* Edit Sekmeleri */}
              <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "#f0fdf4", borderRadius: 12, padding: 4 }}>
                {EDIT_TABS.map(tab => (
                  <button key={tab.id} onClick={() => setEditTab(tab.id)} style={{
                    flex: 1, padding: "8px 4px", background: editTab === tab.id ? "white" : "transparent",
                    border: "none", borderRadius: 9,
                    fontSize: 12, fontWeight: 800, color: editTab === tab.id ? "#2D6A4F" : "#9ca3af",
                    cursor: "pointer", fontFamily: "inherit", boxShadow: editTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Edit Sekme 1 — Temel */}
              {editTab === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("İsim")}
                    {inp("name", "Hayvan ismi")}
                  </div>
                  <div>
                    {lbl("Irk")}
                    <select value={form.breed} onChange={e => set("breed", e.target.value)} style={inputStyle}>
                      <option value="">Seçiniz</option>
                      {breeds.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    {lbl("Cinsiyet")}
                    <select value={form.gender} onChange={e => set("gender", e.target.value)} style={inputStyle}>
                      <option value="erkek">♂ Erkek</option>
                      <option value="disi">♀ Dişi</option>
                    </select>
                  </div>
                  <div>
                    {lbl("Doğum Tarihi" + (age ? ` → ${age.years}y ${age.months}a` : ""))}
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
                  <div style={{ gridColumn: "1/-1" }}>
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
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("🏥 Sağlık Notları")}
                    <textarea value={form.health_notes} onChange={e => set("health_notes", e.target.value)} rows={2} placeholder="Hastalık geçmişi, ilaç..." style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("💉 Aşı Notları")}
                    <textarea value={form.vaccination_notes} onChange={e => set("vaccination_notes", e.target.value)} rows={2} placeholder="Şap, brucella..." style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("📋 Genel Notlar")}
                    <textarea value={form.general_notes} onChange={e => set("general_notes", e.target.value)} rows={2} placeholder="Diğer bilgiler..." style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                </div>
              )}

              {/* Edit Sekme 2 — Kimlik */}
              {editTab === 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("Küpe No (Birincil)")}
                    {inp("ear_tag_no", "TR-1234567890123")}
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("Küpe No 2 (İkincil)")}
                    {inp("ear_tag_no_2", "Varsa ikinci küpe")}
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("Chip No (15 hane)")}
                    {inp("chip_no", "982000123456789")}
                  </div>
                  <div style={{ gridColumn: "1/-1", borderTop: "1px solid #d1fae5", paddingTop: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#2D6A4F", marginBottom: 10 }}>🇹🇷 TÜRKVet</div>
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("TÜRKVet No")}
                    {inp("turkvet_no", "TV-2024-XXXXXXXX")}
                  </div>
                  <div>
                    {lbl("TÜRKVet Kullanıcı No")}
                    {inp("turkvet_kullanici_no", "")}
                  </div>
                  <div>
                    {lbl("TÜRKVet Bildiri No")}
                    {inp("turkvet_bildiri_no", "")}
                  </div>
                  <div style={{ gridColumn: "1/-1", borderTop: "1px solid #d1fae5", paddingTop: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#2D6A4F", marginBottom: 10 }}>📄 Pasaport & İşletme</div>
                  </div>
                  <div>
                    {lbl("Pasaport No")}
                    {inp("pasaport_no", "")}
                  </div>
                  <div>
                    {lbl("IKN")}
                    {inp("ikn", "TR-34-XXXXXXX")}
                  </div>
                </div>
              )}

              {/* Edit Sekme 3 — Soyağacı */}
              {editTab === 3 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    {lbl("Anne Küpe No")}
                    {inp("anne_kupe_no", "")}
                  </div>
                  <div>
                    {lbl("Baba Küpe No")}
                    {inp("baba_kupe_no", "")}
                  </div>
                  <div>
                    {lbl("Anne Irkı")}
                    {inp("anne_irki", "Holstein...")}
                  </div>
                  <div>
                    {lbl("Baba Irkı")}
                    {inp("baba_irki", "Angus...")}
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    {lbl("Soy Kütüğü Sınıfı")}
                    {sel("soy_kutugu_sinifi", [
                      { value: "A", label: "A Sınıfı" },
                      { value: "B", label: "B Sınıfı" },
                      { value: "C", label: "C Sınıfı" },
                    ])}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Butonlar */}
          <div style={{ display: "flex", gap: 8 }}>
            {!isEditing ? (
              <>
                <button onClick={() => showToast(`📱 QR: ${animal.animal_code}`)} style={{ flex: 1, padding: "10px", background: "#2D6A4F", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  📱 QR Kodu İndir
                </button>
                <button onClick={() => setIsEditing(true)} style={{ padding: "10px 20px", background: "#f0fdf4", border: "1.5px solid #d1fae5", borderRadius: 12, fontWeight: 700, fontSize: 13, color: "#2D6A4F", cursor: "pointer", fontFamily: "inherit" }}>
                  ✏️ Düzenle
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: "10px", background: saving ? "#9ca3af" : "#2D6A4F", color: "white", border: "none", borderRadius: 12, fontWeight: 800, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {saving ? "⏳ Kaydediliyor..." : "✅ Kaydet"}
                </button>
                <button onClick={handleCancel} disabled={saving} style={{ padding: "10px 20px", background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 12, fontWeight: 700, fontSize: 13, color: "#dc2626", cursor: "pointer", fontFamily: "inherit" }}>
                  ✕ İptal
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
