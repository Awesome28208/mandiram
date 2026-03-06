'use client'
// app/dashboard/page.tsx

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import TermsModal from '@/components/TermsModal'

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
  const [termsChecked, setTermsChecked] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    const checkTerms = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('terms_accepted')
        .eq('auth_id', user.id)
        .single()

      if (!profile?.terms_accepted) {
        setShowTerms(true)
      }
      setTermsChecked(true)
    }
    checkTerms()
  }, [])

  if (!termsChecked) return (
    <div style={{ minHeight: '100vh', background: '#f0f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', fontFamily: 'Nunito, sans-serif' }}>
        <div style={{ fontSize: '48px' }}>🐄</div>
        <div style={{ color: '#2D6A4F', fontWeight: 700, marginTop: '12px' }}>Yükleniyor...</div>
      </div>
    </div>
  )

  return (
    <>
      {showTerms && <TermsModal onAccepted={() => setShowTerms(false)} />}
      <MandiramDashboard />
    </>
  )
}
