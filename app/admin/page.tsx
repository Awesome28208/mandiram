// app/admin/page.tsx — Admin Panel (Gerçek Supabase + CSV Export)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type AdminTab = 'overview' | 'breeders' | 'animals' | 'export'

export default function AdminPanel() {
  const router = useRouter()
  const [tab, setTab] = useState<AdminTab>('overview')
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [breeders, setBreeders] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500) }

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const { data: profile } = await supabase.from('users').select('role').eq('auth_id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }
      setAuthChecking(false)
      loadData()
    }
    check()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: b }, { data: a }] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: false }),
      supabase.from('animals').select('*, users(full_name, email)').order('created_at', { ascending: false }),
    ])
    setBreeders(b || [])
    setAnimals(a || [])
    setLoading(false)
  }

  const toggleBreeder = async (id: string, currentActive: boolean) => {
    const supabase = createClient()
    await supabase.from('users').update({ is_active: !currentActive }).eq('id', id)
    setBreeders(prev => prev.map(b => b.id === id ? { ...b, is_active: !currentActive } : b))
    const b = breeders.find(b => b.id === id)
    showToast(currentActive ? `🔒 ${b?.full_name} askıya alındı` : `✅ ${b?.full_name} aktif edildi`)
  }

  const exportCSV = async (type: 'animals' | 'breeders' | 'vaccinations' | 'health' | 'milk') => {
    setExporting(true)
    showToast('📊 CSV hazırlanıyor…')
    const supabase = createClient()
    let rows: any[] = []
    let headers: string[] = []
    let filename = ''
    try {
      if (type === 'animals') {
        const { data } = await supabase.from('animals').select('*, users(full_name, email)').order('created_at', { ascending: false })
        headers = ['Sistem Kodu','Küpe No','2. Küpe','Chip No','TÜRKVet No','Pasaport No','IKN','Tür','Irk','Cinsiyet','Doğum Tarihi','Ağırlık (kg)','Tahmini Kesim','Durum','Şehir','İlçe','Besici','Kayıt Tarihi']
        rows = (data||[]).map(a => [a.animal_code,a.ear_tag_no,a.ear_tag_no_2||'',a.chip_no||'',a.turkvet_no||'',a.pasaport_no||'',a.ikn||'',a.species,a.breed,a.gender,a.birth_date||'',a.weight_kg||'',a.est_slaughter_weight||'',a.status,a.city||'',a.district||'',(a.users as any)?.full_name||'',a.created_at?.slice(0,10)])
        filename = `mandiram_hayvanlar_${new Date().toISOString().slice(0,10)}.csv`
      } else if (type === 'breeders') {
        const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
        headers = ['Ad Soyad','E-posta','Telefon','Rol','IKN','İşletme Adı','Şehir','İlçe','TÜRKVet Kullanıcı No','Aktif','Kayıt Tarihi']
        rows = (data||[]).map(u => [u.full_name,u.email,u.phone||'',u.role,u.ikn||'',u.isletme_adi||'',u.isletme_il||'',u.isletme_ilce||'',u.turkvet_kullanici_no||'',u.is_active?'Evet':'Hayır',u.created_at?.slice(0,10)])
        filename = `mandiram_besiciler_${new Date().toISOString().slice(0,10)}.csv`
      } else if (type === 'vaccinations') {
        const { data } = await supabase.from('vaccinations').select('*, animals(ear_tag_no, animal_code)').order('applied_date', { ascending: false })
        headers = ['Küpe No','Sistem Kodu','Aşı Adı','Aşı Türü','Uygulama Tarihi','Sonraki Aşı','Uygulayan','Devlet Programlı','Parti No']
        rows = (data||[]).map(v => [(v.animals as any)?.ear_tag_no||'',(v.animals as any)?.animal_code||'',v.vaccine_name,v.vaccine_type||'',v.applied_date,v.next_due_date||'',v.applied_by||'',v.is_government?'Evet':'Hayır',v.batch_no||''])
        filename = `mandiram_asilar_${new Date().toISOString().slice(0,10)}.csv`
      } else if (type === 'health') {
        const { data } = await supabase.from('health_records').select('*, animals(ear_tag_no)').order('record_date', { ascending: false })
        headers = ['Küpe No','Tarih','Hastalık','Belirtiler','Tanı','Tedavi Başlangıç','Tedavi Bitiş','Sonuç','Veteriner']
        rows = (data||[]).map(h => [(h.animals as any)?.ear_tag_no||'',h.record_date,h.disease_name,h.symptoms||'',h.diagnosis||'',h.treatment_start||'',h.treatment_end||'',h.outcome||'',h.vet_name||''])
        filename = `mandiram_saglik_${new Date().toISOString().slice(0,10)}.csv`
      } else if (type === 'milk') {
        const { data } = await supabase.from('milk_records').select('*, animals(ear_tag_no)').order('record_date', { ascending: false })
        headers = ['Küpe No','Tarih','Sabah (lt)','Akşam (lt)','Toplam (lt)','Yağ %','Protein %','Laktasyon No']
        rows = (data||[]).map(m => [(m.animals as any)?.ear_tag_no||'',m.record_date,m.morning_lt||'',m.evening_lt||'',m.total_lt||'',m.fat_percent||'',m.protein_percent||'',m.lactation_no||''])
        filename = `mandiram_sut_${new Date().toISOString().slice(0,10)}.csv`
      }
      const BOM = '\uFEFF'
      const csv = BOM + [headers,...rows].map(r => r.map((c: any) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      showToast(`✅ ${filename} (${rows.length} kayıt)`)
    } catch { showToast('❌ CSV oluşturulamadı') }
    setExporting(false)
  }

  if (authChecking) return (
    <div style={{ minHeight: '100vh', background: '#0f1e17', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ color: 'white', textAlign: 'center' }}><div style={{ fontSize: 40 }}>🔐</div><div>Yetki kontrol ediliyor…</div></div>
    </div>
  )

  const stats = {
    totalBreeders: breeders.length, activeBreeders: breeders.filter(b => b.is_active).length,
    totalAnimals: animals.length, activeAnimals: animals.filter(a => a.status === 'active').length,
    soldAnimals: animals.filter(a => a.status === 'sold').length,
    buyukbas: animals.filter(a => a.species === 'buyukbas').length,
    kucukbas: animals.filter(a => a.species === 'kucukbas').length,
  }

  const filteredBreeders = breeders.filter(b => !search || b.full_name?.toLowerCase().includes(search.toLowerCase()) || b.email?.toLowerCase().includes(search.toLowerCase()) || b.isletme_il?.toLowerCase().includes(search.toLowerCase()))
  const filteredAnimals = animals.filter(a => !search || a.ear_tag_no?.toLowerCase().includes(search.toLowerCase()) || a.animal_code?.toLowerCase().includes(search.toLowerCase()) || a.breed?.toLowerCase().includes(search.toLowerCase()))

  const TABS = [
    { key: 'overview', icon: '📊', label: 'Genel' },
    { key: 'breeders', icon: '👤', label: `Besiciler (${stats.totalBreeders})` },
    { key: 'animals',  icon: '🐄', label: `Hayvanlar (${stats.totalAnimals})` },
    { key: 'export',   icon: '📥', label: 'CSV Export' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f1e17', fontFamily: "'Nunito', sans-serif", color: 'white' }}>
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#2D6A4F', color: 'white', padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>{toast}</div>}

      <div style={{ background: '#0a1510', borderBottom: '1px solid rgba(82,183,136,0.15)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#52B788', fontSize: 20, cursor: 'pointer' }}>←</button>
        <div><div style={{ fontWeight: 900, fontSize: 16 }}>🛡️ Admin Paneli</div><div style={{ fontSize: 11, color: '#52B788' }}>MandıraM Yönetim</div></div>
        <button onClick={loadData} style={{ marginLeft: 'auto', background: 'rgba(82,183,136,0.1)', border: '1px solid rgba(82,183,136,0.2)', color: '#52B788', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🔄 Yenile</button>
      </div>

      <div style={{ background: '#0a1510', borderBottom: '1px solid rgba(82,183,136,0.1)', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key as AdminTab); setSearch('') }}
            style={{ flex: '0 0 auto', padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap',
              color: tab === t.key ? '#52B788' : 'rgba(255,255,255,0.4)', borderBottom: tab === t.key ? '2px solid #52B788' : '2px solid transparent' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 60px' }}>

        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                ['👤','Toplam Besici',stats.totalBreeders,'#52B788'],['✅','Aktif Besici',stats.activeBreeders,'#22c55e'],
                ['🐄','Toplam Hayvan',stats.totalAnimals,'#52B788'],['🟢','Aktif Hayvan',stats.activeAnimals,'#22c55e'],
                ['💰','Satılan',stats.soldAnimals,'#f59e0b'],['🐄','Büyükbaş',stats.buyukbas,'#60a5fa'],['🐑','Küçükbaş',stats.kucukbas,'#a78bfa'],
              ].map(([icon,label,val,color]) => (
                <div key={label as string} style={{ background: 'rgba(82,183,136,0.05)', border: '1px solid rgba(82,183,136,0.1)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>{icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: color as string, lineHeight: 1 }}>{loading ? '…' : val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(82,183,136,0.05)', border: '1px solid rgba(82,183,136,0.1)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 800, color: '#52B788', marginBottom: 12 }}>🕐 Son Eklenen Hayvanlar</div>
              {loading ? <div style={{ color: 'rgba(255,255,255,0.4)' }}>Yükleniyor…</div> :
                animals.slice(0, 10).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(82,183,136,0.05)', fontSize: 12 }}>
                    <span style={{ fontWeight: 700 }}>{a.ear_tag_no} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>— {a.breed}</span></span>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>{a.created_at?.slice(0,10)}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {tab === 'breeders' && (
          <div>
            <input placeholder="🔍 Ad, e-posta, şehir…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(82,183,136,0.2)', borderRadius: 10, color: 'white', fontSize: 13, fontFamily: 'inherit', marginBottom: 14, boxSizing: 'border-box' }} />
            {loading ? <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>Yükleniyor…</div> :
              filteredBreeders.map(b => (
                <div key={b.id} style={{ background: 'rgba(82,183,136,0.05)', border: '1px solid rgba(82,183,136,0.1)', borderRadius: 10, padding: '12px 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{b.full_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{b.email} · {b.isletme_il||'—'} · {b.role}</div>
                    {b.ikn && <div style={{ fontSize: 11, color: '#52B788' }}>IKN: {b.ikn}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: b.is_active ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: b.is_active ? '#22c55e' : '#ef4444' }}>{b.is_active ? 'Aktif' : 'Askıda'}</span>
                    <button onClick={() => toggleBreeder(b.id, b.is_active)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {b.is_active ? '🔒 Askıya Al' : '✅ Aktif Et'}
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {tab === 'animals' && (
          <div>
            <input placeholder="🔍 Küpe no, ırk, kod…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(82,183,136,0.2)', borderRadius: 10, color: 'white', fontSize: 13, fontFamily: 'inherit', marginBottom: 14, boxSizing: 'border-box' }} />
            {loading ? <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 20 }}>Yükleniyor…</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: '1px solid rgba(82,183,136,0.2)' }}>
                    {['Küpe No','Irk','Tür','Durum','Besici','Şehir','Kayıt'].map(h => <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#52B788', fontWeight: 800, whiteSpace: 'nowrap' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {filteredAnimals.slice(0,50).map((a,i) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(82,183,136,0.05)', background: i%2===0?'transparent':'rgba(82,183,136,0.02)', cursor: 'pointer' }}
                        onClick={() => router.push(`/animals/${a.id}`)}>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{a.ear_tag_no}</td>
                        <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.7)' }}>{a.breed}</td>
                        <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.5)' }}>{a.species==='buyukbas'?'B.baş':'K.baş'}</td>
                        <td style={{ padding: '8px 10px' }}><span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: a.status==='active'?'rgba(34,197,94,0.15)':'rgba(156,163,175,0.15)', color: a.status==='active'?'#22c55e':'#9ca3af' }}>{a.status}</span></td>
                        <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{(a.users as any)?.full_name||'—'}</td>
                        <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{a.city||'—'}</td>
                        <td style={{ padding: '8px 10px', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{a.created_at?.slice(0,10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredAnimals.length > 50 && <div style={{ textAlign: 'center', padding: 12, color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>… {filteredAnimals.length-50} kayıt daha (CSV Export ile tümünü indir)</div>}
              </div>
            )}
          </div>
        )}

        {tab === 'export' && (
          <div>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#fbbf24' }}>
              ⚠️ CSV sadece admin tarafından indirilebilir. Besiciler bu verilere erişemez.
            </div>
            {[
              { type: 'animals', icon: '🐄', title: 'Tüm Hayvanlar', desc: `${animals.length} kayıt — küpe, ırk, TÜRKVet, besici bilgileri` },
              { type: 'breeders', icon: '👤', title: 'Tüm Besiciler', desc: `${breeders.length} kayıt — iletişim, IKN, işletme bilgileri` },
              { type: 'vaccinations', icon: '💉', title: 'Aşı Kayıtları', desc: 'Tüm hayvanların aşı geçmişi' },
              { type: 'health', icon: '🏥', title: 'Sağlık Kayıtları', desc: 'Hastalık ve tedavi geçmişi' },
              { type: 'milk', icon: '🥛', title: 'Süt Verimi', desc: 'Günlük süt verimi verileri' },
            ].map(item => (
              <div key={item.type} style={{ background: 'rgba(82,183,136,0.05)', border: '1px solid rgba(82,183,136,0.1)', borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{item.icon} {item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <button onClick={() => exportCSV(item.type as any)} disabled={exporting}
                  style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap', opacity: exporting ? 0.6 : 1 }}>
                  {exporting ? '…' : '📥 İndir'}
                </button>
              </div>
            ))}
            <div style={{ marginTop: 16, background: 'rgba(82,183,136,0.05)', border: '1px solid rgba(82,183,136,0.1)', borderRadius: 12, padding: 14, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ fontWeight: 800, color: '#52B788', marginBottom: 6 }}>📋 CSV Hakkında</div>
              <div>• UTF-8 BOM — Excel'de Türkçe karakter sorunu yok</div>
              <div>• Tarih: YYYY-MM-DD formatında</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
