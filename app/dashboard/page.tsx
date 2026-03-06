'use client'
// app/dashboard/page.tsx
// Gerçek uygulamada Supabase'den veri çeker.
// Demo modunda mock data ile çalışır.

import dynamic from 'next/dynamic'

// Dashboard bileşenini client-side yükle
const MandiramDashboard = dynamic(
  () => import('../../components/dashboard/MandiramDashboard'),
  { ssr: false, loading: () => (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '48px' }}>🐄</div>
        <div style={{ color: '#2D6A4F', fontWeight: 700, marginTop: '12px' }}>Yükleniyor...</div>
      </div>
    </div>
  )}
)

export default function DashboardPage() {
  return <MandiramDashboard />
}
