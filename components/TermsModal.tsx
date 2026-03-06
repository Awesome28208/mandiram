'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function TermsModal({ onAccepted }: { onAccepted: () => void }) {
  const [accepting, setAccepting] = useState(false)
  const [checked, setChecked] = useState(false)

  const handleAccept = async () => {
    if (!checked) return
    setAccepting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString()
      }).eq('auth_id', user.id)
    }
    setAccepting(false)
    onAccepted()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Nunito, sans-serif', padding: 16
    }}>
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 560,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>

        {/* Başlık */}
        <div style={{ background: '#2D6A4F', padding: '20px 24px', flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>🐄 MandıraM</div>
          <div style={{ fontSize: 13, color: '#b7e4c7', marginTop: 2 }}>
            Kullanmaya başlamadan önce lütfen okuyun
          </div>
        </div>

        {/* İçerik - scroll edilebilir */}
        <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>

          {/* KULLANIM KOŞULLARI */}
          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 16, marginBottom: 16, border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#166534', marginBottom: 12 }}>
              📋 KULLANIM KOŞULLARI
            </div>

            <Madde no="1" baslik="HİZMETİN KAPSAMI">
              MandıraM, hayvancılık işletmelerinin hayvan kayıtlarını dijital ortamda yönetmesine yardımcı olan bir yazılım hizmetidir. Platforma girilen tüm verilerin doğruluğundan yalnızca kullanıcı sorumludur.
            </Madde>

            <Madde no="2" baslik="KULLANICI SORUMLULUKLARI">
              Küpe no, TÜRKVet no ve sağlık kayıtları gibi hayvan bilgilerinin doğruluğu kullanıcıya aittir. TÜRKVet bildirimleri ve veteriner takibi gibi yasal yükümlülükler de yalnızca kullanıcının sorumluluğundadır. Hesap bilgilerinin gizliliğini korumak kullanıcıya aittir.
            </Madde>

            <Madde no="3" baslik="HİZMET KESİNTİLERİ">
              Teknik arızalar, bakım çalışmaları veya mücbir sebepler nedeniyle hizmet geçici olarak erişilemez hale gelebilir. Verilerinizin düzenli yedeklerini almanız tavsiye edilir.
            </Madde>

            <Madde no="4" baslik="FİYATLANDIRMA VE İPTAL">
              Abonelik ücretlerindeki değişiklikler en az <strong>15 gün önceden</strong> bildirilir. Abonelik iptali sonrası verilerinize <strong>15 gün</strong> daha erişebilirsiniz.
            </Madde>

            <Madde no="5" baslik="SORUMLULUK SINIRI">
              MandıraM; veri kaybı, yanlış kayıt, ticari zarar veya TÜRKVet gibi üçüncü taraf sistemleriyle entegrasyon sorunlarından kaynaklanan zararlardan sorumlu tutulamaz.
            </Madde>

            <Madde no="7" baslik="BETA SÜRÜMÜ" son>
              Bu uygulama şu an <strong>beta (test) aşamasındadır</strong>. Yazılımda hatalar, eksiklikler veya beklenmedik davranışlar görülebilir. Verilerinizin düzenli yedeklerini almanız tavsiye edilir. Beta sürecinde geri bildirimleriniz uygulamanın geliştirilmesi için değerlidir.
            </Madde>
          </div>

          {/* KVKK */}
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: 16, border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#1e40af', marginBottom: 12 }}>
              🔒 KİŞİSEL VERİLERİN KORUNMASI (KVKK)
            </div>

            <Madde no="7" baslik="VERİ SORUMLUSU">
              MandıraM — İletişim: <strong>mandiram.destek@gmail.com</strong>
            </Madde>

            <Madde no="8" baslik="TOPLANAN VERİLER">
              Ad, e-posta, telefon (hesap için); işletme bilgileri ve hayvan kayıtları; yüklenen fotoğraf ve belgeler.
            </Madde>

            <Madde no="9" baslik="NEDEN TOPLUYORUZ">
              Hizmeti sunmak, hesabınızı yönetmek ve yasal yükümlülükleri yerine getirmek amacıyla.
            </Madde>

            <Madde no="10" baslik="KİMLERLE PAYLAŞIYORUZ">
              Yalnızca altyapı sağlayıcılarımızla: <strong>Supabase</strong> (veri depolama) ve <strong>Vercel</strong> (uygulama sunumu). Verileriniz üçüncü taraflara <strong>kesinlikle satılmaz</strong>, reklam amaçlı kullanılmaz.
            </Madde>

            <Madde no="11" baslik="HAKLARINIZ">
              Verilerinize erişme, düzeltme, silme ve taşıma hakkına sahipsiniz. Talepler için: <strong>mandiram.destek@gmail.com</strong>
            </Madde>

            <Madde no="12" baslik="VERİ SAKLAMA" son>
              Hesap kapatıldıktan <strong>15 gün</strong> sonra verileriniz kalıcı olarak silinir.
            </Madde>
          </div>
        </div>

        {/* Alt - onay ve buton */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', flexShrink: 0, background: '#fafafa' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, accentColor: '#2D6A4F', cursor: 'pointer', flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
              Yukarıdaki <strong>Kullanım Koşulları</strong> ve <strong>KVKK Aydınlatma Metni</strong>'ni okudum, anladım ve kabul ediyorum.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!checked || accepting}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: checked ? '#2D6A4F' : '#d1d5db',
              color: 'white', fontSize: 15, fontWeight: 900,
              cursor: checked ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }}
          >
            {accepting ? '⏳ Kaydediliyor...' : checked ? '✅ Kabul Ediyorum, Devam Et' : 'Onay kutusunu işaretleyin'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Madde({ no, baslik, children, son }: {
  no: string, baslik: string, children: React.ReactNode, son?: boolean
}) {
  return (
    <div style={{ marginBottom: son ? 0 : 10 }}>
      <span style={{ fontWeight: 800, fontSize: 13, color: '#1a2e1a' }}>
        {no}. {baslik}:{' '}
      </span>
      <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{children}</span>
    </div>
  )
}
