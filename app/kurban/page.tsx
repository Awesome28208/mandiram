'use client'
// app/kurban/page.tsx — Adım 16: Kurban Grubu Yönetimi

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

type KurbanGroup = {
  id: string
  name: string
  animal_id: string | null
  sacrifice_date: string | null
  total_shares: number
  price_per_share: number
  status: string
  notes: string
  animal_code?: string
  ear_tag_no?: string
  species?: string
  partners?: KurbanPartner[]
}

type KurbanPartner = {
  id: string
  group_id: string
  partner_name: string
  partner_phone: string
  share_count: number
  amount_paid: number
  payment_status: string
  notes: string
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  planning:   { label: "Planlama",   color: "#d97706", bg: "#fffbeb" },
  active:     { label: "Aktif",      color: "#16a34a", bg: "#f0fdf4" },
  completed:  { label: "Tamamlandı", color: "#4b5563", bg: "#f9fafb" },
  cancelled:  { label: "İptal",      color: "#dc2626", bg: "#fef2f2" },
}

export default function KurbanPage() {
  const router = useRouter()
  const sb = createClient()

  const [groups, setGroups] = useState<KurbanGroup[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<KurbanGroup | null>(null)
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [showPartnerForm, setShowPartnerForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const emptyGroup = { name: "", animal_id: "", sacrifice_date: "", total_shares: 7, price_per_share: 0, status: "planning", notes: "" }
  const emptyPartner = { partner_name: "", partner_phone: "", share_count: 1, amount_paid: 0, payment_status: "pending", notes: "" }
  const [groupForm, setGroupForm] = useState<typeof emptyGroup>(emptyGroup)
  const [partnerForm, setPartnerForm] = useState<typeof emptyPartner>(emptyPartner)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const setG = (k: string, v: any) => setGroupForm(p => ({ ...p, [k]: v }))
  const setP = (k: string, v: any) => setPartnerForm(p => ({ ...p, [k]: v }))

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    const [groupsRes, animalsRes] = await Promise.all([
      sb.from("kurban_groups").select("*, animals(animal_code, ear_tag_no, species), kurban_partners(*)").order("created_at", { ascending: false }),
      sb.from("animals").select("id, animal_code, ear_tag_no, species, weight_kg").eq("status", "active").order("animal_code")
    ])
    const mapped = (groupsRes.data || []).map((g: any) => ({
      ...g,
      animal_code: g.animals?.animal_code,
      ear_tag_no: g.animals?.ear_tag_no,
      species: g.animals?.species,
      partners: g.kurban_partners || [],
    }))
    setGroups(mapped)
    setAnimals(animalsRes.data || [])
    setLoading(false)
  }

  const handleSaveGroup = async () => {
    if (!groupForm.name) return showToast("❌ Grup adı girin")
    setSaving(true)
    const { error } = await sb.from("kurban_groups").insert({
      name: groupForm.name,
      animal_id: groupForm.animal_id || null,
      sacrifice_date: groupForm.sacrifice_date || null,
      total_shares: groupForm.total_shares,
      price_per_share: groupForm.price_per_share,
      status: groupForm.status,
      notes: groupForm.notes,
    })
    setSaving(false)
    if (error) return showToast("❌ " + error.message)
    showToast("✅ Kurban grubu oluşturuldu!")
    setGroupForm(emptyGroup)
    setShowGroupForm(false)
    fetchData()
  }

  const handleSavePartner = async () => {
    if (!selectedGroup) return
    if (!partnerForm.partner_name) return showToast("❌ Ortak adı girin")
    setSaving(true)
    const { error } = await sb.from("kurban_partners").insert({
      group_id: selectedGroup.id,
      ...partnerForm,
      amount_paid: Number(partnerForm.amount_paid),
      share_count: Number(partnerForm.share_count),
    })
    setSaving(false)
    if (error) return showToast("❌ " + error.message)
    showToast("✅ Ortak eklendi!")
    setPartnerForm(emptyPartner)
    setShowPartnerForm(false)
    fetchData()
  }

  const totalPaid = (g: KurbanGroup) => (g.partners || []).reduce((s, p) => s + (p.amount_paid || 0), 0)
  const totalExpected = (g: KurbanGroup) => g.total_shares * g.price_per_share
  const paidShares = (g: KurbanGroup) => (g.partners || []).reduce((s, p) => s + (p.share_count || 0), 0)

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
      <header style={{ background: "linear-gradient(135deg, #92400e 0%, #b45309 60%, #d97706 100%)", padding: "0 24px", boxShadow: "0 2px 20px rgba(120,53,15,0.4)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.push("/dashboard")} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              ← Geri
            </button>
            <div>
              <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>🐑 Kurban Yönetimi</div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Grup & Ortak Takibi</div>
            </div>
          </div>
          <button onClick={() => setShowGroupForm(true)} style={{ background: "rgba(255,255,255,0.2)", color: "white", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            + Yeni Grup
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>⏳ Yükleniyor...</div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐑</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Henüz kurban grubu yok</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Sağ üstten yeni grup oluşturun</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {groups.map(g => {
              const sc = STATUS_CFG[g.status] || STATUS_CFG.planning
              const paid = totalPaid(g)
              const expected = totalExpected(g)
              const pShares = paidShares(g)
              const progress = expected > 0 ? Math.min(100, (paid / expected) * 100) : 0
              const isSelected = selectedGroup?.id === g.id

              return (
                <div key={g.id} style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", overflow: "hidden" }}>
                  {/* Grup Başlık */}
                  <div
                    onClick={() => setSelectedGroup(isSelected ? null : g)}
                    style={{ padding: "16px 20px", cursor: "pointer", borderBottom: isSelected ? "1px solid #f0f7f4" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <span style={{ fontWeight: 900, fontSize: 16, color: "#1a3d2b" }}>{g.name}</span>
                          <span style={{ background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>{sc.label}</span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 6 }}>
                          {g.animal_code && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Hayvan: </span><b>{g.animal_code}</b></div>}
                          {g.sacrifice_date && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Tarih: </span>{new Date(g.sacrifice_date).toLocaleDateString("tr-TR")}</div>}
                          <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Hisse: </span><b>{pShares}/{g.total_shares}</b></div>
                          {g.price_per_share > 0 && <div style={{ fontSize: 12 }}><span style={{ color: "#9ca3af" }}>Hisse Fiyatı: </span><b>{g.price_per_share.toLocaleString("tr-TR")} ₺</b></div>}
                        </div>
                        {expected > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginBottom: 4 }}>
                              <span>Tahsilat</span>
                              <span style={{ fontWeight: 800 }}>{paid.toLocaleString("tr-TR")} / {expected.toLocaleString("tr-TR")} ₺</span>
                            </div>
                            <div style={{ height: 6, background: "#f0f7f4", borderRadius: 10, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${progress}%`, background: progress >= 100 ? "#16a34a" : "#52B788", borderRadius: 10, transition: "width 0.5s" }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 20, color: "#9ca3af", flexShrink: 0 }}>{isSelected ? "▲" : "▼"}</div>
                    </div>
                  </div>

                  {/* Ortaklar Listesi */}
                  {isSelected && (
                    <div style={{ padding: "0 20px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingTop: 12 }}>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#6b7280" }}>👥 ORTAKLAR ({(g.partners || []).length})</div>
                        <button onClick={() => { setSelectedGroup(g); setShowPartnerForm(true) }}
                          style={{ background: "#f0fdf4", color: "#2D6A4F", border: "1.5px solid #d1fae5", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                          + Ortak Ekle
                        </button>
                      </div>
                      {(g.partners || []).length === 0 ? (
                        <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "16px 0" }}>Henüz ortak eklenmemiş</div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {(g.partners || []).map(p => (
                            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fdf9", borderRadius: 10, padding: "10px 14px" }}>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: 13 }}>{p.partner_name}</div>
                                {p.partner_phone && <div style={{ fontSize: 11, color: "#9ca3af" }}>📱 {p.partner_phone}</div>}
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: 12, fontWeight: 800, color: "#2D6A4F" }}>{p.share_count} hisse</div>
                                <div style={{ fontSize: 11, color: p.payment_status === "paid" ? "#16a34a" : "#d97706" }}>
                                  {p.payment_status === "paid" ? "✅ Ödendi" : `⏳ ${p.amount_paid.toLocaleString("tr-TR")} ₺`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* YENİ GRUP MODAL */}
      {showGroupForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3d2b" }}>🐑 Yeni Kurban Grubu</div>
              <button onClick={() => setShowGroupForm(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Grup Adı *</label>
                <input value={groupForm.name} onChange={e => setG("name", e.target.value)} placeholder="Örn: 2025 Kurban Grubu" style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Hayvan (Opsiyonel)</label>
                <select value={groupForm.animal_id} onChange={e => setG("animal_id", e.target.value)} style={inputStyle}>
                  <option value="">— Henüz seçilmedi —</option>
                  {animals.filter(a => a.species === "buyukbas").map(a => (
                    <option key={a.id} value={a.id}>{a.animal_code} {a.ear_tag_no ? `(${a.ear_tag_no})` : ""} {a.weight_kg ? `- ${a.weight_kg}kg` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Kesim Tarihi</label>
                <input type="date" value={groupForm.sacrifice_date} onChange={e => setG("sacrifice_date", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Durum</label>
                <select value={groupForm.status} onChange={e => setG("status", e.target.value)} style={inputStyle}>
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Toplam Hisse</label>
                <input type="number" value={groupForm.total_shares} onChange={e => setG("total_shares", Number(e.target.value))} min={1} max={7} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hisse Fiyatı (₺)</label>
                <input type="number" value={groupForm.price_per_share} onChange={e => setG("price_per_share", Number(e.target.value))} style={inputStyle} />
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Notlar</label>
                <textarea value={groupForm.notes} onChange={e => setG("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowGroupForm(false)} style={{ flex: 1, padding: "12px", border: "1.5px solid #e7f3ee", borderRadius: 10, background: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#6b7280" }}>İptal</button>
              <button onClick={handleSaveGroup} disabled={saving} style={{ flex: 2, padding: "12px", border: "none", borderRadius: 10, background: "#b45309", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                {saving ? "Kaydediliyor..." : "🐑 Grup Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORTAK EKLE MODAL */}
      {showPartnerForm && selectedGroup && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 420, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3d2b" }}>👤 Ortak Ekle</div>
              <button onClick={() => setShowPartnerForm(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ background: "#f8fdf9", borderRadius: 10, padding: "8px 14px", marginBottom: 16, fontSize: 12, fontWeight: 700, color: "#6b7280" }}>
              Grup: {selectedGroup.name}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Ortak Adı *</label>
                <input value={partnerForm.partner_name} onChange={e => setP("partner_name", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Telefon</label>
                <input value={partnerForm.partner_phone} onChange={e => setP("partner_phone", e.target.value)} placeholder="05xx..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hisse Sayısı</label>
                <input type="number" value={partnerForm.share_count} onChange={e => setP("share_count", e.target.value)} min={1} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ödenen (₺)</label>
                <input type="number" value={partnerForm.amount_paid} onChange={e => setP("amount_paid", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ödeme Durumu</label>
                <select value={partnerForm.payment_status} onChange={e => setP("payment_status", e.target.value)} style={inputStyle}>
                  <option value="pending">⏳ Bekliyor</option>
                  <option value="partial">🔶 Kısmi</option>
                  <option value="paid">✅ Ödendi</option>
                </select>
              </div>
              <div style={{ gridColumn: "1/-1" }}>
                <label style={labelStyle}>Not</label>
                <input value={partnerForm.notes} onChange={e => setP("notes", e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowPartnerForm(false)} style={{ flex: 1, padding: "12px", border: "1.5px solid #e7f3ee", borderRadius: 10, background: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", color: "#6b7280" }}>İptal</button>
              <button onClick={handleSavePartner} disabled={saving} style={{ flex: 2, padding: "12px", border: "none", borderRadius: 10, background: "#2D6A4F", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                {saving ? "Ekleniyor..." : "👤 Ortak Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
