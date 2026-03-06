'use client'
// components/dashboard/MandiramDashboard.tsx — Adım 14+15: Zengin Dashboard

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import AnimalDetailModal from "./AnimalDetailModal"
import AddAnimalModal from "./AddAnimalModal"
import { createClient } from "@/lib/supabase"

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  active:      { label: "Aktif",    color: "#16a34a", bg: "#f0fdf4", icon: "✅" },
  reserved:    { label: "Rezerve", color: "#d97706", bg: "#fffbeb", icon: "🔖" },
  sold:        { label: "Satıldı", color: "#4b5563", bg: "#f9fafb", icon: "✔️" },
  slaughtered: { label: "Kesildi", color: "#dc2626", bg: "#fef2f2", icon: "🔪" },
  dead:        { label: "Öldü",    color: "#7f1d1d", bg: "#fef2f2", icon: "💀" },
  lost:        { label: "Kayıp",   color: "#7c3aed", bg: "#f5f3ff", icon: "❓" },
  archived:    { label: "Arşiv",   color: "#9ca3af", bg: "#f3f4f6", icon: "📦" },
}

export default function MandiramDashboard() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [filterSpecies, setFilterSpecies] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [activeStatFilter, setActiveStatFilter] = useState("all")
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const profileRef = useRef<HTMLDivElement>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  useEffect(() => { fetchAnimals(); fetchUser() }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchUser = async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user) {
      const { data: profile } = await supabase.from("users").select("full_name, email, role").eq("auth_id", data.user.id).single()
      setUser({ email: data.user.email, full_name: profile?.full_name || data.user.email, role: profile?.role })
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth"
  }

  const fetchAnimals = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("animals").select("*").order("created_at", { ascending: false })
      if (error) throw error
      setAnimals(data || [])
    } catch (err) {
      showToast("❌ Veriler yüklenemedi!")
    } finally {
      setLoading(false)
    }
  }

  const filtered = animals.filter(a => {
    if (activeStatFilter !== "all" && a.status !== activeStatFilter) return false
    if (filterSpecies !== "all" && a.species !== filterSpecies) return false
    if (filterStatus !== "all" && a.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return a.ear_tag_no?.toLowerCase().includes(q) || a.animal_code?.toLowerCase().includes(q) ||
             a.breed?.toLowerCase().includes(q) || a.city?.toLowerCase().includes(q) ||
             (a.name && a.name.toLowerCase().includes(q))
    }
    return true
  }).sort((a, b) => {
    if (sortBy === "weight_desc") return (b.weight_kg || 0) - (a.weight_kg || 0)
    if (sortBy === "weight_asc")  return (a.weight_kg || 0) - (b.weight_kg || 0)
    if (sortBy === "oldest")      return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime()
    return new Date(b.birth_date || b.created_at).getTime() - new Date(a.birth_date || a.created_at).getTime()
  })

  const handleAddAnimal = async (newAnimal: any) => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { showToast("❌ Giriş yapmanız gerekiyor!"); return }
      const { data, error } = await supabase.from("animals").insert([{ ...newAnimal, status: "active", owner_id: user.id }]).select().single()
      if (error) throw error
      setAnimals(prev => [data, ...prev])
      showToast("✅ Hayvan kaydı oluşturuldu!")
      setShowAddModal(false)
    } catch (err) {
      showToast("❌ Hayvan eklenemedi!")
    }
  }

  const handleUpdateAnimal = async (id: string, updatedData: any) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("animals").update(updatedData).eq("id", id).select().single()
      if (error) throw error
      setAnimals(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
      setSelectedAnimal((prev: any) => prev?.id === id ? { ...prev, ...data } : prev)
      showToast("✅ Hayvan bilgileri güncellendi!")
    } catch (err) {
      showToast("❌ Güncelleme başarısız!")
      throw err
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("animals").update({ status }).eq("id", id)
      if (error) throw error
      setAnimals(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      showToast(`✅ Durum güncellendi: ${STATUS_CFG[status]?.label}`)
      setSelectedAnimal(null)
    } catch (err) {
      showToast("❌ Durum güncellenemedi!")
    }
  }

  // ── İSTATİSTİK HESAPLARI ──────────────────────────────────────────────────
  const buyukbas = animals.filter(a => a.species === "buyukbas")
  const kucukbas = animals.filter(a => a.species === "kucukbas")
  const aktif = animals.filter(a => a.status === "active")
  const avgWeight = aktif.filter(a => a.weight_kg).length > 0
    ? Math.round(aktif.filter(a => a.weight_kg).reduce((s, a) => s + a.weight_kg, 0) / aktif.filter(a => a.weight_kg).length)
    : 0
  const totalWeight = Math.round(aktif.filter(a => a.weight_kg).reduce((s, a) => s + a.weight_kg, 0))

  // Ağırlık dağılımı (besi takip özeti)
  const weightBuckets = [
    { label: "0–200 kg",  min: 0,   max: 200,  count: aktif.filter(a => a.weight_kg > 0   && a.weight_kg <= 200).length },
    { label: "200–400 kg",min: 200, max: 400,  count: aktif.filter(a => a.weight_kg > 200 && a.weight_kg <= 400).length },
    { label: "400–600 kg",min: 400, max: 600,  count: aktif.filter(a => a.weight_kg > 400 && a.weight_kg <= 600).length },
    { label: "600+ kg",   min: 600, max: 9999, count: aktif.filter(a => a.weight_kg > 600).length },
  ].filter(b => b.count > 0)
  const maxBucket = Math.max(...weightBuckets.map(b => b.count), 1)

  // Son eklenenler (son 7 gün)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const recentCount = animals.filter(a => new Date(a.created_at) > sevenDaysAgo).length

  return (
    <div style={{ minHeight: "100vh", background: "#f0f7f4", fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f0f7f4; }
        ::-webkit-scrollbar-thumb { background: #52B788; border-radius: 3px; }
        @keyframes slideIn { from { transform: translateX(40px) scale(0.95); opacity: 0; } to { transform: translateX(0) scale(1); opacity: 1; } }
        @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeDown { from { transform: translateY(-8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animal-card { transition: transform 0.2s, box-shadow 0.2s; }
        .animal-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(45,106,79,0.18) !important; }
        .stat-card { transition: all 0.2s; cursor: pointer; }
        .stat-card:hover { transform: translateY(-2px); }
        .btn-hover:hover { opacity: 0.88; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: "#2D6A4F", color: "white", padding: "12px 20px", borderRadius: "14px", fontSize: "14px", fontWeight: 700, boxShadow: "0 8px 24px rgba(45,106,79,0.4)", animation: "slideIn 0.3s ease" }}>
          {toast}
        </div>
      )}

      {/* HEADER */}
      <header style={{ background: "linear-gradient(135deg, #1b4332 0%, #2D6A4F 60%, #40916C 100%)", padding: "0 24px", boxShadow: "0 2px 20px rgba(27,67,50,0.4)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 30 }}>🐄</span>
            <div>
              <div style={{ color: "white", fontWeight: 900, fontSize: 20, letterSpacing: "-0.02em" }}>MandıraM</div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Hayvan Kayıt v1.1</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {user?.role === "admin" && (
              <button onClick={() => router.push("/admin")} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                ⚙️ Admin
              </button>
            )}
            <button className="btn-hover" onClick={() => setShowAddModal(true)} style={{ background: "#52B788", color: "white", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
              + Hayvan Ekle
            </button>
            <div ref={profileRef} style={{ position: "relative" }}>
              <div onClick={() => setShowProfileMenu(p => !p)} style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, border: showProfileMenu ? "2px solid rgba(255,255,255,0.6)" : "2px solid transparent", transition: "border 0.2s" }}>
                👤
              </div>
              {showProfileMenu && (
                <div style={{ position: "absolute", top: 46, right: 0, background: "white", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", minWidth: 220, overflow: "hidden", animation: "fadeDown 0.2s ease", zIndex: 200 }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f7f4", background: "#f8fdf9" }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1a3d2b" }}>{user?.full_name || "Kullanıcı"}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{user?.email || ""}</div>
                    {user?.role === "admin" && <span style={{ display: "inline-block", marginTop: 4, background: "#fef3c7", color: "#92400e", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>ADMIN</span>}
                  </div>
                  <button onClick={handleLogout} style={{ width: "100%", padding: "12px 16px", background: "white", border: "none", textAlign: "left", fontSize: 13, fontWeight: 700, color: "#dc2626", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                    onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                    🚪 Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── İSTATİSTİK PANELİ ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 14, color: "#1a3d2b", textTransform: "uppercase", letterSpacing: "0.05em" }}>📊 Sürü Özeti</div>
            <button onClick={() => setShowStats(s => !s)} style={{ background: "none", border: "none", fontSize: 12, color: "#9ca3af", cursor: "pointer", fontWeight: 700 }}>
              {showStats ? "▲ Gizle" : "▼ Göster"}
            </button>
          </div>

          {showStats && (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              {/* ANA STAT KARTLARI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 12 }}>
                {[
                  { icon: "🐄", label: "Büyükbaş",   val: buyukbas.length, sub: `${buyukbas.filter(a=>a.status==="active").length} aktif`, color: "#2D6A4F", key: "buyukbas_all" },
                  { icon: "🐑", label: "Küçükbaş",   val: kucukbas.length, sub: `${kucukbas.filter(a=>a.status==="active").length} aktif`, color: "#1D4ED8", key: "kucukbas_all" },
                  { icon: "📊", label: "Toplam",      val: animals.length,  sub: `${recentCount} bu hafta`, color: "#374151", key: "all" },
                  { icon: "✅", label: "Aktif",       val: aktif.length,    sub: `${aktif.filter(a=>a.species==="buyukbas").length} bb / ${aktif.filter(a=>a.species==="kucukbas").length} kb`, color: "#16a34a", key: "active" },
                  { icon: "🔖", label: "Rezerve",    val: animals.filter(a=>a.status==="reserved").length, sub: "satışa hazır", color: "#d97706", key: "reserved" },
                  { icon: "⚖️", label: "Ort. Ağırlık",val: avgWeight ? `${avgWeight} kg` : "—", sub: `toplam ${totalWeight} kg`, color: "#7c3aed", key: null },
                ].map((card, i) => (
                  <div key={i} className={card.key ? "stat-card" : ""} onClick={() => card.key && setActiveStatFilter(card.key === "buyukbas_all" || card.key === "kucukbas_all" ? "all" : card.key)}
                    style={{ background: (card.key && activeStatFilter === card.key) ? card.color : "white",
                      border: `2px solid ${(card.key && activeStatFilter === card.key) ? card.color : "#e7f3ee"}`,
                      borderRadius: 14, padding: "14px 12px", textAlign: "center",
                      boxShadow: (card.key && activeStatFilter === card.key) ? `0 4px 20px ${card.color}44` : "0 1px 4px rgba(0,0,0,0.05)",
                      cursor: card.key ? "pointer" : "default" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{card.icon}</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: (card.key && activeStatFilter === card.key) ? "white" : "#1a3d2b", lineHeight: 1 }}>{card.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: (card.key && activeStatFilter === card.key) ? "rgba(255,255,255,0.85)" : "#6b7280", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</div>
                    <div style={{ fontSize: 10, color: (card.key && activeStatFilter === card.key) ? "rgba(255,255,255,0.6)" : "#9ca3af", marginTop: 2 }}>{card.sub}</div>
                  </div>
                ))}
              </div>

              {/* BESİ TAKİP GRAFİĞİ — Ağırlık Dağılımı */}
              {weightBuckets.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {/* Sol: Ağırlık dağılımı bar chart */}
                  <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1.5px solid #e7f3ee", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: "#1a3d2b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>⚖️ Ağırlık Dağılımı (Aktif)</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {weightBuckets.map(b => (
                        <div key={b.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 3 }}>
                            <span>{b.label}</span>
                            <span style={{ color: "#2D6A4F" }}>{b.count} hayvan</span>
                          </div>
                          <div style={{ background: "#f0f7f4", borderRadius: 6, overflow: "hidden", height: 10 }}>
                            <div style={{ width: `${(b.count / maxBucket) * 100}%`, height: "100%", background: "linear-gradient(90deg, #2D6A4F, #52B788)", borderRadius: 6, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sağ: Tür & Durum özeti */}
                  <div style={{ background: "white", borderRadius: 14, padding: 16, border: "1.5px solid #e7f3ee", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontWeight: 800, fontSize: 12, color: "#1a3d2b", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>📋 Durum Dağılımı</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                        const count = animals.filter(a => a.status === key).length
                        if (!count) return null
                        return (
                          <div key={key} onClick={() => setActiveStatFilter(key)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "4px 6px", borderRadius: 8, background: activeStatFilter === key ? cfg.bg : "transparent", transition: "background 0.15s" }}>
                            <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#374151" }}>{cfg.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, background: cfg.bg, padding: "2px 8px", borderRadius: 20 }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FİLTRE ÇUBUĞU ──────────────────────────────────────────────────── */}
        <div style={{ background: "white", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", border: "1.5px solid #e7f3ee" }}>
          <div style={{ flex: "1 1 200px", position: "relative" }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Küpe no, kod, ırk, şehir…" style={{ width: "100%", padding: "8px 12px 8px 30px", border: "1.5px solid #d1fae5", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#f8faf8" }} />
          </div>
          {[
            { val: filterSpecies, set: setFilterSpecies, opts: [["all","🐄🐑 Tüm Türler"],["buyukbas","🐄 Büyükbaş"],["kucukbas","🐑 Küçükbaş"]] },
            { val: filterStatus, set: setFilterStatus, opts: [["all","Tüm Durumlar"],["active","Aktif"],["reserved","Rezerve"],["sold","Satıldı"],["slaughtered","Kesildi"],["dead","Öldü"],["archived","Arşiv"]] },
            { val: sortBy, set: setSortBy, opts: [["newest","En Yeni"],["oldest","En Eski"],["weight_desc","Ağır → Hafif"],["weight_asc","Hafif → Ağır"]] },
          ].map((s, i) => (
            <select key={i} value={s.val} onChange={e => s.set(e.target.value)} style={{ padding: "8px 28px 8px 12px", border: "1.5px solid #d1fae5", borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#f8faf8", color: "#374151", cursor: "pointer", outline: "none", fontWeight: 600 }}>
              {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
            {(["grid", "table"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{ padding: "7px 12px", border: `1.5px solid ${viewMode === m ? "#2D6A4F" : "#d1fae5"}`, background: viewMode === m ? "#2D6A4F" : "white", color: viewMode === m ? "white" : "#6b7280", borderRadius: 8, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
                {m === "grid" ? "⊞" : "☰"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{loading ? "⏳ Yükleniyor..." : `${filtered.length} hayvan${search ? ` · "${search}" araması` : ""}${activeStatFilter !== "all" ? ` · ${STATUS_CFG[activeStatFilter]?.label || activeStatFilter}` : ""}`}</span>
          {activeStatFilter !== "all" && (
            <button onClick={() => setActiveStatFilter("all")} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer", fontWeight: 700, textDecoration: "underline" }}>✕ Filtreyi Kaldır</button>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#52B788", fontSize: 16, fontWeight: 700 }}>
            🐄 Hayvanlar yükleniyor...
          </div>
        )}

        {/* ── GRİD GÖRÜNÜMÜ ──────────────────────────────────────────────────── */}
        {!loading && viewMode === "grid" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, animation: "fadeUp 0.3s ease" }}>
            {filtered.map(animal => {
              const cfg = STATUS_CFG[animal.status] || STATUS_CFG.active
              const hasPhoto = !!animal.cover_photo_url
              return (
                <div key={animal.id} className="animal-card" onClick={() => router.push(`/animals/${animal.id}`)}
                  style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1.5px solid #e7f3ee", cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
                  
                  {/* Fotoğraf alanı */}
                  <div style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden",
                    background: hasPhoto ? "#000" : `linear-gradient(135deg, ${animal.species === "buyukbas" ? "#2D6A4F,#52B788" : "#1D4ED8,#60A5FA"})` }}>
                    {hasPhoto ? (
                      <img src={animal.cover_photo_url} alt={animal.breed} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 8 }}>
                        <span style={{ fontSize: 48, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{animal.species === "buyukbas" ? "🐄" : "🐑"}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>Fotoğraf Yok</span>
                      </div>
                    )}
                    {/* Alt gradient + isim */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.65))", padding: "20px 12px 10px" }}>
                      <div style={{ color: "white", fontWeight: 900, fontSize: 14, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{animal.ear_tag_no || animal.animal_code}</div>
                      <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700 }}>{animal.breed} · {animal.gender === "erkek" ? "♂ Erkek" : "♀ Dişi"}</div>
                    </div>
                    {/* Durum badge */}
                    <div style={{ position: "absolute", top: 8, right: 8, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, backdropFilter: "blur(4px)" }}>
                      {cfg.icon} {cfg.label}
                    </div>
                  </div>

                  {/* Kart altı */}
                  <div style={{ padding: "12px 14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                      {[
                        ["⚖️", animal.weight_kg ? `${animal.weight_kg} kg` : "—"],
                        ["📍", animal.city || "—"],
                        ["🏷", animal.animal_code || "—"],
                        ["📅", animal.birth_date ? new Date().getFullYear() - new Date(animal.birth_date).getFullYear() + " yaş" : "—"],
                      ].map(([icon, val], i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#4b5563" }}>
                          <span>{icon}</span>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn-hover" onClick={e => { e.stopPropagation(); router.push(`/animals/${animal.id}`) }}
                        style={{ flex: 1, padding: "7px", background: "#f0fdf4", border: "1.5px solid #d1fae5", borderRadius: 8, fontSize: 11, fontWeight: 800, color: "#2D6A4F", cursor: "pointer", fontFamily: "inherit" }}>
                        📋 Detay
                      </button>
                      <button className="btn-hover" onClick={e => { e.stopPropagation(); router.push(`/scan/${animal.id}`) }}
                        style={{ padding: "7px 10px", background: "#f8faf8", border: "1.5px solid #e7f3ee", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>
                        📱
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🐄</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Hayvan bulunamadı</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>{search ? "Arama kriterlerinizi değiştirin" : "Henüz hayvan kaydı yok"}</div>
              </div>
            )}
          </div>
        )}

        {/* ── TABLO GÖRÜNÜMÜ ──────────────────────────────────────────────────── */}
        {!loading && viewMode === "table" && (
          <div style={{ background: "white", borderRadius: 14, overflow: "hidden", border: "1.5px solid #e7f3ee", boxShadow: "0 1px 8px rgba(0,0,0,0.05)", animation: "fadeUp 0.3s ease" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f0f7f4" }}>
                    {["", "Küpe No", "Tür / Irk", "Cin.", "Yaş", "Ağırlık", "Konum", "Durum", ""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1.5px solid #e7f3ee", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => {
                    const cfg = STATUS_CFG[a.status] || STATUS_CFG.active
                    const ageYears = a.birth_date ? new Date().getFullYear() - new Date(a.birth_date).getFullYear() : null
                    return (
                      <tr key={a.id} onClick={() => router.push(`/animals/${a.id}`)}
                        style={{ borderBottom: "1px solid #f0f7f4", cursor: "pointer", background: i % 2 === 0 ? "white" : "#fafcfb", transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f0fdf4")}
                        onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "white" : "#fafcfb")}>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", background: a.species === "buyukbas" ? "#d1fae5" : "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                            {a.cover_photo_url
                              ? <img src={a.cover_photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                              : (a.species === "buyukbas" ? "🐄" : "🐑")}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, fontSize: 13 }}>{a.ear_tag_no || a.animal_code}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13 }}>{a.species === "buyukbas" ? "🐄" : "🐑"} {a.breed}</td>
                        <td style={{ padding: "10px 14px", fontSize: 14 }}>{a.gender === "erkek" ? "♂" : "♀"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#374151" }}>{ageYears !== null ? `${ageYears} yaş` : "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: a.weight_kg ? "#1a3d2b" : "#9ca3af" }}>{a.weight_kg ? `${a.weight_kg} kg` : "—"}</td>
                        <td style={{ padding: "10px 14px", fontSize: 12, color: "#6b7280" }}>{a.city || "—"}</td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "3px 9px", borderRadius: 20, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 800 }}>{cfg.icon} {cfg.label}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <button onClick={e => { e.stopPropagation(); router.push(`/animals/${a.id}`) }}
                            style={{ padding: "5px 12px", background: "#f0fdf4", border: "1.5px solid #d1fae5", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#2D6A4F", cursor: "pointer", fontFamily: "inherit" }}>Detay</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 14 }}>🐄 Hayvan bulunamadı</div>
              )}
            </div>
          </div>
        )}
      </main>

      {selectedAnimal && (
        <AnimalDetailModal
          animal={selectedAnimal}
          onClose={() => setSelectedAnimal(null)}
          onStatusChange={handleStatusChange}
          onUpdate={handleUpdateAnimal}
          showToast={showToast}
        />
      )}
      {showAddModal && <AddAnimalModal onClose={() => setShowAddModal(false)} onAdd={handleAddAnimal} />}
    </div>
  )
}
