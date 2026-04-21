import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { useAttendance, useEmployees } from '../hooks/useData'
import { todayStr, weekRange, monthRange, fmtDate, fmtDay, fmtRupiah, hitungGaji, workdaysInRange } from '../lib/utils'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ─── sub-components ──────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:'11px 0', flex:1, background:'transparent', border:'none',
    color: active ? '#4af0c8' : '#444', cursor:'pointer',
    fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:1,
    borderBottom: active ? '2px solid #4af0c8' : '2px solid transparent',
    transition:'all .15s'
  }}>{label}</button>
)

const Card = ({ icon, label, value, sub, color='#4af0c8' }) => (
  <div style={{ background:'#070718', border:'1px solid #0e0e2a', borderRadius:14, padding:'14px 16px' }}>
    <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
    <div style={{ color, fontSize:22, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{value}</div>
    <div style={{ color:'#aaa', fontSize:11, marginTop:2 }}>{label}</div>
    {sub && <div style={{ color:'#555', fontSize:10, marginTop:3 }}>{sub}</div>}
  </div>
)

const SectionTitle = ({ children }) => (
  <p style={{ color:'#4af0c8', fontSize:10, letterSpacing:3, margin:'22px 0 12px', fontWeight:700 }}>{children}</p>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0d0d22', border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 12px', fontFamily:"'Space Mono',monospace", fontSize:11 }}>
      <p style={{ color:'#888', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, margin:'2px 0' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OwnerDashboard({ employees, onLogout, onRefreshEmployees }) {
  const today = todayStr()
  const [tab, setTab] = useState('dashboard')
  const [filterMode, setFilterMode] = useState('harian')
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(today)
  const [viewPhoto, setViewPhoto] = useState(null)
  const [salaryMonth, setSalaryMonth] = useState(today.slice(0, 7))

  const dateRange = useMemo(() => {
    if (filterMode === 'harian') return { start: today, end: today }
    if (filterMode === 'mingguan') return weekRange()
    if (filterMode === 'bulanan') return monthRange()
    return { start: customStart, end: customEnd }
  }, [filterMode, customStart, customEnd, today])

  const { records, loading } = useAttendance(dateRange.start, dateRange.end)

  const salaryRange = useMemo(() => {
    const d = new Date(salaryMonth + '-01')
    return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd') }
  }, [salaryMonth])
  const { records: salaryRecords } = useAttendance(salaryRange.start, salaryRange.end)

  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees])

  const todayRecords = records.filter(r => r.tanggal === today)
  const hadirHariIni = todayRecords.filter(r => r.jam_masuk).length
  const telatHariIni = todayRecords.filter(r => r.status_masuk === 'telat').length

  const dailyChart = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(dateRange.start + 'T00:00:00'), end: new Date(dateRange.end + 'T00:00:00') })
    return days.map(d => {
      const ds = format(d, 'yyyy-MM-dd')
      const dayRecs = records.filter(r => r.tanggal === ds)
      return {
        hari: format(d, filterMode === 'harian' ? 'HH:mm' : 'dd/MM', { locale: localeId }),
        Hadir: dayRecs.filter(r => r.jam_masuk).length,
        Telat: dayRecs.filter(r => r.status_masuk === 'telat').length,
        Absen: employees.length - dayRecs.filter(r => r.jam_masuk).length,
      }
    })
  }, [records, dateRange, filterMode, employees])

  const empChart = useMemo(() => employees.map(emp => {
    const recs = records.filter(r => r.employee_id === emp.id)
    return {
      name: emp.name.split(' ')[0],
      Hadir: recs.filter(r => r.jam_masuk).length,
      Absen: workdaysInRange(dateRange.start, dateRange.end) - recs.filter(r => r.jam_masuk).length,
      Telat: recs.filter(r => r.status_masuk === 'telat').length,
    }
  }), [records, employees, dateRange])

  const pieData = [
    { name:'Hadir', value: hadirHariIni, color:'#4af0c8' },
    { name:'Tidak Hadir', value: employees.length - hadirHariIni, color:'#1e3a5f' },
  ]

  const salaryData = useMemo(() => employees.map(emp => {
    const recs = salaryRecords.filter(r => r.employee_id === emp.id)
    return { ...emp, ...hitungGaji(emp, recs, salaryRange.start, salaryRange.end) }
  }), [employees, salaryRecords, salaryRange])

  return (
    <div style={{ minHeight:'100vh', background:'#04040f', fontFamily:"'Space Mono',monospace", color:'#e0e0f0' }}>
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.97)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, cursor:'pointer' }}>
          <div style={{ textAlign:'center' }}>
            <img src={viewPhoto} style={{ maxWidth:'min(420px,90vw)', borderRadius:14, border:'2px solid #4af0c8', transform:'scaleX(-1)', display:'block' }} alt="Preview" />
            <p style={{ color:'#555', fontSize:11, marginTop:10 }}>Tap untuk menutup</p>
          </div>
        </div>
      )}

      <div style={{ background:'#070718', borderBottom:'1px solid #0e0e28', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <p style={{ color:'#4af0c8', fontSize:14, letterSpacing:3, fontFamily:"'Syne',sans-serif", fontWeight:800, margin:0 }}>OWNER PANEL</p>
          <p style={{ color:'#333', fontSize:9, marginTop:2, letterSpacing:1 }}>{fmtDay(today)}, {fmtDate(today)}</p>
        </div>
        <button onClick={onLogout} style={{ background:'transparent', border:'1px solid #1a1a3a', color:'#444', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>KELUAR</button>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #0e0e28', background:'#070718' }}>
        <Tab label="📊 DASHBOARD" active={tab==='dashboard'} onClick={() => setTab('dashboard')} />
        <Tab label="💰 GAJI"      active={tab==='gaji'}      onClick={() => setTab('gaji')} />
        <Tab label="📋 ABSENSI"   active={tab==='absensi'}   onClick={() => setTab('absensi')} />
        <Tab label="⚙️ SETTING"   active={tab==='setting'}   onClick={() => setTab('setting')} />
      </div>

      <div style={{ padding:20 }}>
        {(tab === 'dashboard' || tab === 'absensi') && (
          <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: filterMode === 'kustom' ? 10 : 0 }}>
              {['harian','mingguan','bulanan','kustom'].map(m => (
                <button key={m} onClick={() => setFilterMode(m)} style={{
                  padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:10, letterSpacing:1,
                  background: filterMode===m ? '#4af0c8' : 'transparent',
                  color: filterMode===m ? '#021a14' : '#555',
                  border: `1px solid ${filterMode===m ? '#4af0c8' : '#1a1a3a'}`,
                  textTransform:'uppercase'
                }}>{m}</button>
              ))}
            </div>
            {filterMode === 'kustom' && (
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:4 }}>
                <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}
                  style={{ background:'#0a0a1e', border:'1px solid #2a2a4a', borderRadius:8, padding:'6px 10px', color:'#4af0c8', fontFamily:'inherit', fontSize:11 }} />
                <span style={{ color:'#444' }}>—</span>
                <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}
                  style={{ background:'#0a0a1e', border:'1px solid #2a2a4a', borderRadius:8, padding:'6px 10px', color:'#4af0c8', fontFamily:'inherit', fontSize:11 }} />
              </div>
            )}
            {filterMode !== 'kustom' && (
              <p style={{ color:'#333', fontSize:10, marginTop:filterMode==='kustom'?0:8 }}>
                {dateRange.start === dateRange.end ? fmtDate(dateRange.start) : `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}`}
              </p>
            )}
          </div>
        )}

        {tab === 'dashboard' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:4 }}>
              <Card icon="👥" label="Total Karyawan
