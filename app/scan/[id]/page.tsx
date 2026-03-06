// app/scan/[id]/page.tsx — Public QR Tarama Sayfası
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Animal, AnimalMedia, STATUS_LABELS, SPECIES_LABELS } from '../../../types'

export default function ScanPage({ params }: { params: { id: string } }) {
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [media, setMedia] = useState<AnimalMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)

  useEffect(() => {
    async function load() {
      const { data: animalData } = await supabase
        .from('animals_full')
        .select('*')
        .eq('id', params.id)
        .single()

      if (!animalData) { setNotFound(true); setLoading(false); return }
      setAnimal(animalData)

      const { data: mediaData } = await supabase
        .from('animal_media')
        .select('*')
        .eq('animal_id', params.id)
        .order('order_index')

      setMedia(mediaData || [])
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a1510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>🐄</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#0a1510', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ textAlign: 'center', color: 'white', padding: '24px' }}>
        <div style={{ fontSize: '60px' }}>🔍</div>
        <h2 style={{ margin: '12px 0 8px', fontWeight: 900 }}>Hayvan Bulunamadı</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Bu QR koda ait kayıt mevcut değil.</p>
      </div>
    </div>
  )

  const statusCfg = {
    active:      { label: 'Aktif',    color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    reserved:    { label: 'Rezerve', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    sold:        { label: 'Satıldı', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
    slaughtered: { label: 'Kesildi', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    archived:    { label: 'Arşiv',   color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
  }[animal!.status] || { label: '—', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a2818, #1b4332)', fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '22px' }}>🐄</span>
          <span style={{ color: 'white', fontWeight: 900, fontSize: '16px' }}>MandıraM</span>
        </div>
        <div style={{ background: 'rgba(82,183,136,0.15)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#52B788', fontWeight: 700 }}>
          🔍 QR Tarama
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Photo Gallery */}
        {media.length > 0 && (
          <div style={{ borderRadius: '20px', overflow: 'hidden', marginBottom: '16px', position: 'relative' }}>
            <img
              src={media[activePhoto]?.url}
              alt="Hayvan fotoğrafı"
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
              {media.map((_, i) => (
                <button key={i} onClick={() => setActivePhoto(i)} style={{
                  width: i === activePhoto ? '20px' : '8px', height: '8px', borderRadius: '4px',
                  background: i === activePhoto ? 'white' : 'rgba(255,255,255,0.5)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s', padding: 0,
                }} />
              ))}
            </div>
            {/* Status badge overlay */}
            <div style={{ position: 'absolute', top: '12px', right: '12px', background: statusCfg.bg, backdropFilter: 'blur(8px)', border: `1px solid ${statusCfg.color}44`, padding: '4px 12px', borderRadius: '20px' }}>
              <span style={{ color: statusCfg.color, fontWeight: 800, fontSize: '12px' }}>● {statusCfg.label}</span>
            </div>
          </div>
        )}

        {/* Animal ID Card */}
        <div style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', padding: '20px 22px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: 'white' }}>
                {animal!.species === 'buyukbas' ? '🐄' : '🐑'} {animal!.breed}
                <span style={{ marginLeft: '6px', fontSize: '18px' }}>{animal!.gender === 'erkek' ? '♂' : '♀'}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginTop: '3px' }}>{animal!.animal_code}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: '🏷', label: 'Küpe No', val: animal!.ear_tag_no },
              { icon: '📅', label: 'Doğum', val: animal!.birth_date },
              { icon: '⚖️', label: 'Ağırlık', val: animal!.weight_kg ? `${animal!.weight_kg} kg` : '—' },
              { icon: '📍', label: 'Konum', val: `${animal!.city} / ${animal!.district}` },
              { icon: '🕐', label: 'Yaş', val: `${animal!.age_years || 0} yıl ${animal!.age_months || 0} ay` },
              { icon: '🧬', label: 'Tür', val: SPECIES_LABELS[animal!.species] },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.icon} {item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: 'white', marginTop: '3px' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Thumbnail strip */}
        {media.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '14px', paddingBottom: '4px' }}>
            {media.map((m, i) => (
              <button key={i} onClick={() => setActivePhoto(i)} style={{
                flexShrink: 0, width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden',
                border: `2px solid ${i === activePhoto ? '#52B788' : 'transparent'}`, padding: 0, cursor: 'pointer',
              }}>
                <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}

        {/* Owner contact — only shown if status is active/reserved */}
        {(animal!.status === 'active' || animal!.status === 'reserved') && animal!.owner_phone && (
          <a
            href={`https://wa.me/90${animal!.owner_phone?.replace(/\D/g, '').replace(/^0/, '')}?text=Merhaba, MandıraM'da ${animal!.animal_code} kodlu hayvan hakkında bilgi almak istiyorum.`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '14px', background: '#25D366',
              color: 'white', borderRadius: '14px', fontWeight: 900, fontSize: '15px',
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
              marginBottom: '12px',
            }}>
            💬 WhatsApp ile İletişime Geç
          </a>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '20px' }}>
          Bu QR kodu MandıraM tarafından oluşturulmuştur.<br />
          <span style={{ color: '#52B788', fontWeight: 700 }}>mandiram.com</span>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
    </div>
  )
}
