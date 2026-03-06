'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', city: '', turkvet_no: '' })
  const [passwords, setPasswords] = useState({ new: '', confirm: '' })

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }
  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))
  const upP = (k: string, v: string) => setPasswords(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      const { data } = await supabase.from('users').select('*').eq('auth_id', user.id).single()
      if (data) setForm({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        city: data.city || '',
        turkvet_no: data.turkvet_no || ''
      })
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { showToast('❌ Oturum bulunamadı!'); return }

      const { error } = await supabase
        .from('users')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          city: form.city,
          turkvet_no: form.turkvet_no
        })
        .eq('auth_id', user.id)  // ✅ userId state yerine direkt user.id

      if (error) {
        console.error('Profil güncelleme hatası:', error)
        showToast('❌ Kaydedilemedi: ' + error.message)
      } else {
        showToast('✅ Profil güncellendi!')
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) { showToast('❌ Şifreler eşleşmiyor!'); return }
    if (passwords.new.length < 8) { showToast('❌ Şifre en az 8 karakter olmalı!'); return }
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    if (error) showToast('❌ Şifre değiştirilemedi!')
    else { showToast('✅ Şifre güncellendi!'); setPasswords({ new: '', confirm: '' }) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>🐄</div><div style={{ color: '#2D6A4F', fontWeight: 700, marginTop: 12 }}>Yükleniyor...</div></div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0}`}</style>

      {toast && <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#2D6A4F', color: 'white', padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700, boxShadow: '0 8px 24px rgba(45,106,79,0.4)' }}>{toast}</div>}

      <header style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2D6A4F 60%, #40916C 100%)', padding: '0 24px', boxShadow: '0 2px 20px rgba(27,67,50,0.4)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => window.location.href = '/dashboard'} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13 }}>← Geri</button>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 18 }}>Profil Ayarları</div>
          </div>
          <span style={{ fontSize: 28 }}>🐄</span>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: '24px', marginBottom: 20, border: '1.5px solid #e7f3ee', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1a3d2b', marginBottom: 20 }}>👤 Kişisel Bilgiler</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <F label="Ad Soyad" value={form.full_name} onChange={(v: string) => up('full_name', v)} placeholder="Ahmet Yılmaz" />
            <F label="E-posta" value={form.email} onChange={() => {}} placeholder="besici@email.com" disabled />
            <F label="Telefon" value={form.phone} onChange={(v: string) => up('phone', v)} placeholder="0532 000 00 00" />
            <F label="Şehir" value={form.city} onChange={(v: string) => up('city', v)} placeholder="Konya" />
            <div style={{ gridColumn: '1/-1' }}>
              <F label="TürkVet / İşletme No" value={form.turkvet_no} onChange={(v: string) => up('turkvet_no', v)} placeholder="TR-06-2024-0001" />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} style={{ marginTop: 20, padding: '10px 28px', background: saving ? '#86efac' : 'linear-gradient(135deg, #2D6A4F, #40916C)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: '24px', border: '1.5px solid #e7f3ee', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#1a3d2b', marginBottom: 20 }}>🔒 Şifre Değiştir</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <F label="Yeni Şifre" value={passwords.new} onChange={(v: string) => upP('new', v)} placeholder="En az 8 karakter" type="password" />
            <F label="Yeni Şifre Tekrar" value={passwords.confirm} onChange={(v: string) => upP('confirm', v)} placeholder="Şifreyi tekrar girin" type="password" />
          </div>
          <button onClick={handlePasswordChange} disabled={!passwords.new || !passwords.confirm} style={{ marginTop: 20, padding: '10px 28px', background: !passwords.new ? '#e5e7eb' : 'linear-gradient(135deg, #1e40af, #3b82f6)', color: !passwords.new ? '#9ca3af' : 'white', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: !passwords.new ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            🔑 Şifreyi Güncelle
          </button>
        </div>
      </main>
    </div>
  )
}

function F({ label, value, onChange, placeholder, type = 'text', disabled = false }: any) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#374151', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1fae5', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: disabled ? '#9ca3af' : '#111', background: disabled ? '#f3f4f6' : '#f8faf8', outline: 'none', cursor: disabled ? 'not-allowed' : 'text' }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = '#52B788' }}
        onBlur={e => e.target.style.borderColor = '#d1fae5'} />
    </div>
  )
}
