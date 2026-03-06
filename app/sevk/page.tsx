'use client'
// app/sevk/page.tsx — Adım 13: Hayvan Sevk Kaydı & Sorgulama

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

type Movement = {
  id: string
  animal_id: string
  movement_type: string
  movement_date: string
  from_ikn: string
  to_ikn: string
  from_location: string
  to_location: string
  vet_health_report: string
  transport_company: string
  plate_no: string
  movement_reason: string
  turkvet_bildiri_no: string
  notes: string
  animal_code?: string
  ear_tag_no?: string
}

const MOVEMENT_TYPES: Record<string, { label: string; icon: string; color: string }> = {
  sale:       { label: "Satış",       icon: "💰", color: "#16a34a" },
  transfer:   { label: "Nakil",       icon: "🚛", color: "#2563eb" },
  slaughter:  { label: "Kesim",       icon: "🔪", color: "#dc2626" },
  birth:      { label: "Doğum",       icon: "🐣", color: "#7c3aed" },
  purchase:   { label: "Satın Alma",  icon: "🛒", color: "#d97706" },
  return:     { label: "İade",        icon: "↩️", color: "#6b7280" },
  other:      { label: "Diğer",       icon: "📋", color: "#9ca3af" },
}

export default function SevkPage() {
  const router = useRouter()
  const sb = createClient()

  const [animals, setAnimals] = useState<any[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [toast, setToast] = useState<string | null>(null)

  const emptyForm = {
    animal_id: "", movement_type: "transfer", movement_date: new Date().toISOString().split('T')[0],
    from_ikn: "", to_ikn: "", from_location: "", to_location: "",
    vet_health_report: "", transport_company: "", plate_no: "",
    movement_reason: "", turkvet_bildiri_no: "", notes: ""
  }
  const [form, setForm] = useState(emptyForm)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [animalsRes, movementsRes] = await Promise.all([
      sb.from("animals").select("id, animal_code, ear_tag_no, species, breed").order("animal_code"),
      sb.from("animal_movements")
        .select("*, animals(animal_code, ear_tag_no)")
        .order("movement_date", { ascending: false })
        .limit(50)
    ])
    setAnimals(animalsRes.data || [])
    const mvs = (movementsRes.data || []).map((m: any) => ({
      ...m,
      animal_code: m.animals?.animal_code,
      ear_tag_no: m.animals?.ear_tag_no,
    }))
    setMovements(mvs)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.animal_id) return showToast("❌ Hayvan seçin")
    if (!form.movement_date) return showToast("❌ Tarih girin")
    setSaving(true)
    const { error } = await sb.from("animal_movements").insert({
      ...form,
      animal_id: form.animal_id || null,
    })
    setSaving(false)
    if (error) return showToast("❌ Hata: " + error.message)
    showToast("✅ Sevk kaydedildi!")
    setForm(emptyForm)
    setShowForm(false)
    fetchData()
  }

  const filtered = movements.filter(m => {
    const matchSearch = !search ||
      (m.animal_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.ear_tag_no || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.plate_no || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.turkvet_bildiri_no || "").toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === "all" || m.movement_type === filterType
    return matchSearch && matchType
  })

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", border: "1.5px solid #d1fae5",
    borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", background: "white"
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, color: "#6b7280",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "block"
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7f4", fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#2D6A4F", color: "white", padding: "12px 20px", borderRadius: 14, fontSize: 14, fontWeight: 700, boxShadow: "0 8px 24px rgba(45,106,79,0.4)" }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header style={{ background: "linear-gradient(135deg, #1b4332 0%, #2D6A4F 60%, #40916C 100%)", padding: "0 24px", boxShadow: "0 2px 20px rgba(27,67,50,0.4)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/dashboard")} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ← Geri
            </button>
            <div>
              <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>🚛 Sevk Kayıtları</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Hareket & Nakil Takibi</div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} style={{ background: "#52B788", color: "white", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            + Yeni Sevk
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        {/* FİLTRE */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Küpe no, araç plaka, TÜRKVet no..."
            style={{ flex: 1, minWidth: 200, padding: "10px 14px", border: "1.5px solid #d1fae5", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: "10px 14px", border: "1.5px solid #d1fae5", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
            <option value="all">Tüm Hareketler</option>
            {Object.entries(MOVEMENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>

        {/* ÖZET KARTLAR */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
          {Object.entries(MOVEMENT_TYPES).map(([k, v]) => {
            const count = movements.filter(m => m.movement_type === k).length
            if (count === 0) return null
            return (
              <div key={k} onClick={() => setFilterType(filterType === k ? "all" : k)}
                style={{ background: "white", borderRadius: 12, padding: "12px 14px", cursor: "pointer", border: `2px solid ${filterType === k ? v.color : "#e7f3ee"}`, transition: "all 0.15s" }}>
                <div style={{ fontSize: 20 }}>{v.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: v.color }}>{count}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>{v.label}</div>
              </div>
            )
          })}
        </div>

        {/* KAYITLAR */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>⏳ Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🚛</div>
            <div style={{ fontWeight: 700 }}>Henüz sevk kaydı yok</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Sağ üstten yeni sevk ekleyebilirsiniz</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(m => {
              const mt = MOVEMENT_TYPES[m.movement_type] || MOVEMENT_TYPES.other
              return (
                <div key={m.id} style={{ background: "white", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderLeft: `4px solid ${mt.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{mt.icon}</span>
                        <span style={{ fontWeight: 900, fontSize: 14, color: mt.color }}>{mt.label}</span>
                        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700 }}>
                          {new Date(m.movement_date).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {m.animal_code && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Hayvan: </span><span style={{ fontWeight: 800 }}>{m.animal_code}</span></div>}
                        {m.ear_tag_no && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Küpe: </span><span style={{ fontWeight: 700 }}>{m.ear_tag_no}</span></div>}
                        {m.from_location && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Çıkış: </span>{m.from_location}</div>}
                        {m.to_location && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Varış: </span>{m.to_location}</div>}
                        {m.plate_no && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Plaka: </span><span style={{ fontWeight: 800, fontFamily: "monospace" }}>{m.plate_no}</span></div>}
                        {m.turkvet_bildiri_no && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>TÜRKVet: </span>{m.turkvet_bildiri_no}</div>}
                        {m.vet_health_report && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Sağ. Rap: </span>{m.vet_health_report}</div>}
                        {m.transport_company && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Nakliyeci: </span>{m.transport_company}</div>}
                      </div>
                      {m.notes && <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280", background: "#f8fdf9", borderRadius: 8, padding: "6px 10px" }}>{m.notes}</div>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* YENİ SEVK MODAL */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 540, maxHeight: "90vh", overflowY: "auto", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3d2b" }}>🚛 Yeni Sevk Kaydı</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Hayvan *</label>
                <select value={form.animal_id} onChange={e => set("animal_id", e.target.value)} style={inputStyle}>
                  <option value="">— Hayvan Seçin —</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.animal_code} {a.ear_tag_no ? `(${a.ear_tag_no})` : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Hareket Tipi *</label>
                <select value={form.movement_type} onChange={e => set("movement_type", e.target.value)} style={inputStyle}>
                  {Object.entries(MOVEMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Tarih *</label>
                <input type="date" value={form.movement_date} onChange={e => set("movement_date", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Çıkış IKN</label>
                <input value={form.from_ikn} onChange={e => set("from_ikn", e.target.value)} placeholder="TR..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Varış IKN</label>
                <input value={form.to_ikn} onChange={e => set("to_ikn", e.target.value)} placeholder="TR..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Çıkış Yeri</label>
                <input value={form.from_location} onChange={e => set("from_location", e.target.value)} placeholder="İl/İlçe" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Varış Yeri</label>
                <input value={form.to_location} onChange={e => set("to_location", e.target.value)} placeholder="İl/İlçe" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Araç Plakası</label>
                <input value={form.plate_no} onChange={e => set("plate_no", e.target.value.toUpperCase())} placeholder="34 ABC 123" style={{ ...inputStyle, fontFamily: "monospace" }} />
              </div>
              <div>
                <label style={labelStyle}>Nakliyeci</label>
                <input value={form.transport_company} onChange={e => set("transport_company", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Vet. Sağlık Raporu</label>
                <input value={form.vet_health_report} onChange={e => set("vet_health_report", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TÜRKVet Bildiri No</label>
                <input value={form.turkvet_bildiri_no} onChange={e => set("turkvet_bildiri_no", e.target.value)} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Hareket Nedeni</label>
                <input value={form.movement_reason} onChange={e => set("movement_reason", e.target.value)} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Notlar</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "12px", border: "1.5px solid #d1fae5", borderRadius: 10, background: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#6b7280" }}>
                İptal
              </button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: "12px", border: "none", borderRadius: 10, background: "#2D6A4F", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Kaydediliyor..." : "💾 Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
