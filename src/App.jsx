import { useState, useEffect } from 'react'
import PinScreen     from './components/PinScreen'
import EmployeePage  from './components/EmployeePage'
import OwnerDashboard from './components/OwnerDashboard'
import { useEmployees } from './hooks/useData'

export default function App() {
  const [role, setRole]     = useState(null)  // null | 'owner' | 'employee'
  const [currentEmp, setCurrentEmp] = useState(null)
  const { employees, loading, refetch } = useEmployees()

  const handleLogin = (r, emp) => { setRole(r); setCurrentEmp(emp) }
  const handleLogout = () => { setRole(null); setCurrentEmp(null) }

  if (loading && !role) {
    return (
      <div style={{ minHeight:'100vh', background:'#04040f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace" }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⏱</div>
          <p style={{ color:'#333', fontSize:11, letterSpacing:3 }}>MEMUAT DATA...</p>
        </div>
      </div>
    )
  }

  if (!role) return <PinScreen employees={employees} onLogin={handleLogin} />

  if (role === 'owner') return (
    <OwnerDashboard
      employees={employees}
      onLogout={handleLogout}
      onRefreshEmployees={refetch}
    />
  )

  return (
    <EmployeePage
      employee={currentEmp}
      allEmployees={employees}
      onLogout={handleLogout}
    />
  )
}
