'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', full_name: '', phone: '', city: '' })

  const up = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleLogin = async () => {
    setLoading(true); setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    if (error) {
      setError(error.message.includes('Invalid login') ? 'E-posta veya şifre hatalı.' : error.message)
    } else if (data.session) {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  const handleRegister = async () => {
    setLoading(true); setError(null)
    if (form.password !== form.confirmPassword) { setError('Şifreler eşleşmiyor.'); setLoading(false); return }
    if (form.password.length < 8) { setError('Şifre en az 8 karakter olmalı.'); setLoading(false); return }
    if (!form.full_name.trim()) { setError('Ad soyad zorunludur.'); setLoading(false); return }

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('users').insert({
        auth_id: data.user.id,
        email: form.email,
        full_name: form.full_name,
        phone: form.phone,
        city: form.city,
        role: 'breeder'
      })
    }
    setSuccess('Kayıt başarılı! E-postanızı doğrulayın.')
    setLoading(false)
  }

  const handleEnter = (e: any) => { if (e.key === 'Enter') handleLogin() }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a2818 0%, #1b4332 40%, #2D6A4F 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Nunito', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'); *{box-sizing:border-box}`}</style>
      <div style={{ width: '100%', maxWidth: '420px', background: 'rgba(255,255,255,0.97)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ background: 'linear-gradient(135deg, #1b4332, #2D6A4F)', padding: '28px 32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🐄</div>
          <div style={{ color: 'white', fontWeight: 900, fontSize: '24px' }}>MandıraM</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>Hayvan Kayıt Sistemi</div>
        </div>
        <div style={{ display: 'flex', background: '#f0f7f4', margin: '20px 24px 0', borderRadius: '12px', padding: '4px' }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); setSuccess(null) }} style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '9px', background: mode === m ? 'white' : 'transparent', color: mode === m ? '#1b4332' : '#6b7280', fontWeight: 800, fontSize: '13px', cursor: 'pointer', boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {m === 'login' ? '🔑 Giriş Yap' : '✨ Kayıt Ol'}
            </button>
          ))}
        </div>
        <div style={{ padding: '20px 24px 28px' }}>
          {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>⚠️ {error}</div>}
          {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>✅ {success}</div>}
          {mode === 'login' ? (
            <div>
              <F label="E-posta" type="email" placeholder="besici@email.com" value={form.email} onChange={v => up('email', v)} onKeyDown={handleEnter} />
              <F label="Şifre" type="password" placeholder="••••••••" value={form.password} onChange={v => up('password', v)} onKeyDown={handleEnter} />
              <button onClick={handleLogin} disabled={loading || !form.email || !form.password} style={btn(loading)}>{loading ? '⏳ Giriş yapılıyor...' : '→ Giriş Yap'}</button>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>Şifremi unuttum</span>
              </div>
            </div>
          ) : (
            <div>
              <F label="Ad Soyad *" type="text" placeholder="Ahmet Yılmaz" value={form.full_name} onChange={v => up('full_name', v)} />
              <F label="E-posta *" type="email" placeholder="besici@email.com" value={form.email} onChange={v => up('email', v)} />
              <F label="Telefon" type="tel" placeholder="0532 000 00 00" value={form.phone} onChange={v => up('phone', v)} />
              <F label="Şehir" type="text" placeholder="Konya" value={form.city} onChange={v => up('city', v)} />
              <F label="Şifre *" type="password" placeholder="En az 8 karakter" value={form.password} onChange={v => up('password', v)} />
              <F label="Şifre Tekrar *" type="password" placeholder="Şifreyi tekrar girin" value={form.confirmPassword} onChange={v => up('confirmPassword', v)} />
              <button onClick={handleRegister} disabled={loading || !form.email || !form.password || !form.full_name} style={btn(loading)}>{loading ? '⏳ Kayıt oluşturuluyor...' : '✨ Hesap Oluştur'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function F({ label, type, placeholder, value, onChange, onKeyDown }: any) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#374151', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #d1fae5', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', color: '#111', background: '#f8faf8', outline: 'none' }}
        onFocus={e => e.target.style.borderColor = '#52B788'} onBlur={e => e.target.style.borderColor = '#d1fae5'} />
    </div>
  )
}

const btn = (loading: boolean): any => ({
  width: '100%', padding: '12px',
  background: loading ? '#86efac' : 'linear-gradient(135deg, #2D6A4F, #40916C)',
  color: 'white', border: 'none', borderRadius: '12px',
  fontWeight: 900, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer',
  fontFamily: 'inherit', marginTop: '6px',
  boxShadow: '0 4px 16px rgba(45,106,79,0.35)'
})
