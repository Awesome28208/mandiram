'use client'
export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
        <h2 style={{ color: '#1a2e1a', fontWeight: 900, marginBottom: 8 }}>İnternet Bağlantısı Yok</h2>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
          Şu an çevrimdışısınız. Daha önce yüklenen hayvan bilgileri görüntülenebilir, ancak yeni kayıt eklemek için internete ihtiyaç var.
        </p>
        <button onClick={() => window.location.href = '/dashboard'}
          style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          🏠 Dashboard'a Git
        </button>
      </div>
    </div>
  )
}
