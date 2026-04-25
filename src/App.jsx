import { useState } from 'react'
import PinScreen     from './components/PinScreen'
import EmployeePage  from './components/EmployeePage'
import OwnerDashboard from './components/OwnerDashboard'
import { useEmployees } from './hooks/useData'
import { useTheme } from './context/ThemeContext'
import { DARK, LIGHT } from './lib/themes'

export default function App() {
  const [role, setRole]     = useState(null)
  const [currentEmp, setCurrentEmp] = useState(null)
  const { employees, loading, refetch } = useEmployees()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const handleLogin  = (r, emp) => { setRole(r); setCurrentEmp(emp) }
  const handleLogout = () => { setRole(null); setCurrentEmp(null) }

  if (loading && !role) {
    return (
      <div style={{ minHeight:'100vh', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace" }}>
        <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.65;transform:scale(0.94)}}`}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{
            width:60, height:60, borderRadius:20,
            background: isDark ? 'linear-gradient(135deg,#0a2a4a,#0a4a3a)' : 'linear-gradient(135deg,#dff5ef,#d4eef8)',
            border:`1px solid ${t.accentBorder}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:26, margin:'0 auto 14px',
            animation:'pulse 1.8s ease-in-out infinite',
          }}>⏱</div>
          <p style={{ color:t.textMuted, fontSize:11, letterSpacing:3 }}>MEMUAT DATA...</p>
        </div>
      </div>
    )
  }

  if (!role) return <PinScreen employees={employees} onLogin={handleLogin} />

  if (role === 'owner') return (
    <OwnerDashboard employees={employees} onLogout={handleLogout} onRefreshEmployees={refetch} />
  )

  return (
    <EmployeePage employee={currentEmp} allEmployees={employees} onLogout={handleLogout} />
  )
}
