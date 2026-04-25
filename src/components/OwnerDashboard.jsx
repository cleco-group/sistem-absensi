import { useState, useMemo, useRef, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { useAttendance, useEmployees } from '../hooks/useData'
import { todayStr, weekRange, monthRange, fmtDate, fmtDay, fmtRupiah, hitungGaji, workdaysInRange } from '../lib/utils'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'

// ─── Avatar helper ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#4af0c8','#00c8ff','#ff6b9d','#a78bfa','#ffaa44','#34d399','#f87171']
const getAvatarColor = name => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const getInitials    = name => name.split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase()

const Avatar = ({ name, size = 38 }) => {
  const color = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1.5px solid ${color}62`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color,
      flexShrink: 0, fontFamily: "'Syne',sans-serif",
      boxShadow: `0 0 16px ${color}28`,
    }}>{getInitials(name)}</div>
  )
}

// ─── sub-components ──────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <button onClick={onClick} style={{
      padding:'12px 0', flex:1, background:'transparent', border:'none',
      color: active ? t.accent : t.textMuted, cursor:'pointer',
      fontFamily:"'Space Mono',monospace", fontSize:10, letterSpacing:1.5,
      borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
      transition:'all .2s', position:'relative',
    }}>
      {active && (
        <span style={{
          position:'absolute', bottom:-1, left:'50%', transform:'translateX(-50%)',
          width:24, height:2, borderRadius:2,
          background:t.gradientAccent, filter:'blur(2px)', pointerEvents:'none',
        }} />
      )}
      {label}
    </button>
  )
}

const Card = ({ icon, label, value, sub, gradient, glow }) => {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  const cardRef = useRef(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, shine: { x: 50, y: 50 } })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = useCallback((e) => {
    const el = cardRef.current
    if (!el) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width  - 0.5
    const y = (e.clientY - top)  / height - 0.5
    setTilt({ x: y * 12, y: x * -12, shine: { x: (e.clientX - left) / width * 100, y: (e.clientY - top) / height * 100 } })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0, shine: { x: 50, y: 50 } })
    setHovered(false)
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseMove={isDark ? handleMouseMove : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        background: isDark
          ? 'linear-gradient(145deg, rgba(10,10,28,0.98), rgba(7,7,20,0.96))'
          : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : t.border}`,
        borderRadius: 18, padding: '18px 16px',
        boxShadow: isDark
          ? `0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.05) inset${glow ? ', ' + glow : ''}`
          : `${t.cardShadow}${glow ? ', ' + glow : ''}`,
        transform: `perspective(700px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${hovered ? 1.025 : 1},${hovered ? 1.025 : 1},1)`,
        transition: hovered ? 'transform 0.08s ease, box-shadow 0.2s ease' : 'transform 0.45s cubic-bezier(0.34,1.2,0.64,1), box-shadow 0.4s ease',
        position: 'relative', overflow: 'hidden', cursor: 'default',
      }}
    >
      {/* Shine overlay */}
      {isDark && hovered && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', zIndex: 1,
          background: `radial-gradient(circle at ${tilt.shine.x}% ${tilt.shine.y}%, rgba(255,255,255,0.07) 0%, transparent 60%)`,
        }} />
      )}
      {/* Holographic shimmer */}
      {isDark && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(135deg, rgba(74,240,200,0.035) 0%, rgba(0,200,255,0.025) 40%, rgba(167,139,250,0.035) 70%, rgba(255,107,157,0.025) 100%)',
          backgroundSize: '300% 300%',
          animation: 'holo-shift 6s ease infinite',
          opacity: hovered ? 1 : 0.5,
          transition: 'opacity 0.3s',
        }} />
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize:26, marginBottom:10 }}>{icon}</div>
        <div style={{
          fontSize:30, fontWeight:800, fontFamily:"'Syne',sans-serif",
          background: gradient || t.gradientAccent,
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          lineHeight:1.1, marginBottom:6,
        }}>{value}</div>
        <div style={{ color:t.textSub, fontSize:11 }}>{label}</div>
        {sub && <div style={{ color:t.textMuted, fontSize:10, marginTop:2 }}>{sub}</div>}
      </div>
    </div>
  )
}

const SectionTitle = ({ children }) => {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'24px 0 14px' }}>
      <div style={{ width:3, height:14, borderRadius:2, background:t.gradientAccent, flexShrink:0 }} />
      <p style={{ color:t.accent, fontSize:10, letterSpacing:3, margin:0, fontWeight:700 }}>{children}</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:t.tooltipBg, border:`1px solid ${t.tooltipBorder}`, borderRadius:10, padding:'10px 14px', fontFamily:"'Space Mono',monospace", fontSize:11, boxShadow:t.cardShadow }}>
      <p style={{ color:t.textSub, marginBottom:6, fontWeight:700 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, margin:'3px 0' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OwnerDashboard({ employees, onLogout, onRefreshEmployees }) {
  const today = todayStr()
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

  const [tab, setTab] = useState('dashboard')
  const [filterMode, setFilterMode] = useState('harian')
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(today)
  const [viewPhoto, setViewPhoto] = useState(null)
  const [salaryFilterMode, setSalaryFilterMode] = useState('bulanan')
  const [salaryMonth, setSalaryMonth] = useState(today.slice(0, 7))
  const [salaryCustomStart, setSalaryCustomStart] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'))
  const [salaryCustomEnd, setSalaryCustomEnd] = useState(today)

  const dateRange = useMemo(() => {
    if (filterMode === 'harian') return { start: today, end: today }
    if (filterMode === 'mingguan') return weekRange()
    if (filterMode === 'bulanan') return monthRange()
    return { start: customStart, end: customEnd }
  }, [filterMode, customStart, customEnd, today])

  const { records, loading } = useAttendance(dateRange.start, dateRange.end)

  const salaryRange = useMemo(() => {
    if (salaryFilterMode === 'kustom') return { start: salaryCustomStart, end: salaryCustomEnd }
    if (salaryFilterMode === 'mingguan') return weekRange()
    if (salaryFilterMode === 'triwulan') {
      return { start: format(subDays(new Date(), 89), 'yyyy-MM-dd'), end: today }
    }
    const d = new Date(salaryMonth + '-01')
    return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd') }
  }, [salaryFilterMode, salaryMonth, salaryCustomStart, salaryCustomEnd, today])
  const { records: salaryRecords } = useAttendance(salaryRange.start, salaryRange.end)

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
    { name:'Hadir',      value: hadirHariIni,                    color: t.chartHadir },
    { name:'Tidak Hadir',value: employees.length - hadirHariIni, color: t.chartNoData },
  ]

  const salaryData = useMemo(() => employees.map(emp => {
    const recs = salaryRecords.filter(r => r.employee_id === emp.id)
    return { ...emp, ...hitungGaji(emp, recs, salaryRange.start, salaryRange.end) }
  }), [employees, salaryRecords, salaryRange])

  return (
    <div style={{ minHeight:'100vh', background:t.bgMesh, fontFamily:"'Space Mono',monospace", color:t.text }}>
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position:'fixed', inset:0, background:t.bgOverlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, cursor:'pointer', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
          <div style={{ textAlign:'center', animation:'slide-up 0.2s ease' }}>
            <img src={viewPhoto} style={{ maxWidth:'min(420px,90vw)', borderRadius:20, border:`2px solid ${t.accent}`, transform:'scaleX(-1)', display:'block', boxShadow:`0 0 48px ${t.accent}35` }} alt="Preview" />
            <p style={{ color:t.textMuted, fontSize:11, marginTop:14 }}>Tap untuk menutup</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: t.headerBg,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderBottom:`1px solid ${isDark ? 'rgba(255,255,255,0.06)' : t.border}`,
        padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center',
        position:'sticky', top:0, zIndex:100,
        boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.5)' : '0 2px 20px rgba(30,32,60,0.07)',
      }}>
        <div>
          <p style={{
            fontSize:15, letterSpacing:4, fontFamily:"'Syne',sans-serif", fontWeight:800, margin:0,
            background:t.gradientAccent,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
          }}>OWNER PANEL</p>
          <p style={{ color:t.textDim, fontSize:9, marginTop:2, letterSpacing:1 }}>{fmtDay(today)}, {fmtDate(today)}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={toggleTheme} className="btn-lift" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : t.bgCardAlt, border:`1px solid ${isDark ? 'rgba(255,255,255,0.1)' : t.border}`, borderRadius:10, padding:'7px 11px', cursor:'pointer', fontSize:15, lineHeight:1 }}>{isDark ? '☀️' : '🌙'}</button>
          <button onClick={onLogout} className="btn-lift" style={{ background:'transparent', border:`1px solid ${t.borderSub}`, color:t.textMuted, borderRadius:9, padding:'7px 13px', cursor:'pointer', fontFamily:'inherit', fontSize:10, letterSpacing:1 }}>KELUAR</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${isDark ? 'rgba(255,255,255,0.06)' : t.border}`, background: isDark ? 'rgba(7,7,22,0.95)' : 'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)' }}>
        <Tab label="📊 DASHBOARD" active={tab==='dashboard'} onClick={() => setTab('dashboard')} />
        <Tab label="💰 GAJI"      active={tab==='gaji'}      onClick={() => setTab('gaji')} />
        <Tab label="📋 ABSENSI"   active={tab==='absensi'}   onClick={() => setTab('absensi')} />
        <Tab label="⚙️ SETTING"   active={tab==='setting'}   onClick={() => setTab('setting')} />
      </div>

      <div style={{ padding:20 }}>
        {(tab === 'dashboard' || tab === 'absensi') && (
          <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:'12px 14px', marginBottom:20, boxShadow:t.shadow }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: filterMode === 'kustom' ? 10 : 0 }}>
              {['harian','mingguan','bulanan','kustom'].map(m => (
                <button key={m} onClick={() => setFilterMode(m)} style={{
                  padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:10, letterSpacing:1,
                  background: filterMode===m ? t.accent : 'transparent',
                  color: filterMode===m ? t.accentText : t.textMuted,
                  border: `1px solid ${filterMode===m ? t.accent : t.borderSub}`,
                  textTransform:'uppercase', transition:'all .15s',
                }}>{m}</button>
              ))}
            </div>
            {filterMode === 'kustom' && (
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:4 }}>
                <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}
                  style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:'6px 10px', color:t.accent, fontFamily:'inherit', fontSize:11 }} />
                <span style={{ color:t.textMuted }}>—</span>
                <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}
                  style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:'6px 10px', color:t.accent, fontFamily:'inherit', fontSize:11 }} />
              </div>
            )}
            {filterMode !== 'kustom' && (
              <p style={{ color:t.textDim, fontSize:10, marginTop:8 }}>
                {dateRange.start === dateRange.end ? fmtDate(dateRange.start) : `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}`}
              </p>
            )}
          </div>
        )}

        {tab === 'dashboard' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:4 }}>
              <Card icon="👥" label="Total Karyawan"    value={employees.length} gradient={t.gradientNeutral} />
              <Card icon="✅" label="Hadir Hari Ini"     value={hadirHariIni}                    gradient={t.gradientAccent} glow={t.glowAccent} />
              <Card icon="❌" label="Tidak Hadir"        value={employees.length - hadirHariIni} gradient={t.gradientDanger} glow={t.glowDanger} />
              <Card icon="⏰" label="Terlambat Hari Ini" value={telatHariIni}                    gradient={t.gradientWarn}   glow={t.glowWarn} />
            </div>

            <SectionTitle>KEHADIRAN HARI INI</SectionTitle>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:'16px 0 8px', boxShadow:t.shadow }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color:t.textSub, fontSize:11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <SectionTitle>TREN KEHADIRAN</SectionTitle>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:'16px 8px 8px', boxShadow:t.shadow }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart} barGap={2}>
                  <XAxis dataKey="hari" tick={{ fill:t.chartText, fontSize:10, fontFamily:"'Space Mono'" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:t.chartText, fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Hadir" fill={t.chartHadir} radius={[4,4,0,0]} />
                  <Bar dataKey="Telat" fill={t.chartTelat}  radius={[4,4,0,0]} />
                  <Bar dataKey="Absen" fill={t.chartAbsen}  radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <SectionTitle>RINGKASAN PER KARYAWAN</SectionTitle>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:'16px 8px 8px', boxShadow:t.shadow }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={empChart} layout="vertical">
                  <XAxis type="number" tick={{ fill:'#444', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill:t.textSub, fontSize:10, fontFamily:"'Space Mono'" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Hadir" fill={t.chartHadir} radius={[0,4,4,0]} />
                  <Bar dataKey="Absen" fill={t.chartAbsen} radius={[0,4,4,0]} />
                  <Bar dataKey="Telat" fill={t.chartTelat} radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'gaji' && (
          <>
            {/* Salary period filter card */}
            <div style={{
              background: isDark ? 'linear-gradient(145deg, rgba(10,10,28,0.98), rgba(7,7,20,0.96))' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : t.border}`,
              borderRadius: 16, padding: '16px', marginBottom: 20,
              boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset' : t.cardShadow,
            }}>
              <p style={{ color:t.textDim, fontSize:10, letterSpacing:2, marginBottom:10 }}>PERIODE GAJI</p>

              {/* Mode pills */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
                {[
                  { id:'mingguan',  label:'Minggu Ini',  icon:'📅' },
                  { id:'bulanan',   label:'Bulanan',     icon:'📆' },
                  { id:'triwulan', label:'3 Bulan',    icon:'🗓️' },
                  { id:'kustom',    label:'Kustom',      icon:'✏️' },
                ].map(({ id, label, icon }) => (
                  <button key={id} onClick={() => setSalaryFilterMode(id)} style={{
                    padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 10, letterSpacing: 1,
                    background: salaryFilterMode === id
                      ? t.gradientAccent
                      : isDark ? 'rgba(255,255,255,0.04)' : t.bgCardAlt,
                    color: salaryFilterMode === id ? t.accentText : t.textMuted,
                    border: `1px solid ${salaryFilterMode === id ? 'transparent' : isDark ? 'rgba(255,255,255,0.08)' : t.border}`,
                    boxShadow: salaryFilterMode === id ? t.glowAccent : 'none',
                    transition: 'all .15s',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span>{icon}</span> {label.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Month picker — bulanan */}
              {salaryFilterMode === 'bulanan' && (
                <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                  <div>
                    <label style={{ color:t.textMuted, fontSize:10, letterSpacing:1, display:'block', marginBottom:4 }}>BULAN</label>
                    <input type="month" value={salaryMonth} onChange={e => setSalaryMonth(e.target.value)}
                      style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:'7px 12px', color:t.accent, fontFamily:'inherit', fontSize:12 }} />
                  </div>
                  <div style={{ marginTop:16 }}>
                    <p style={{ color:t.textSub, fontSize:11, margin:'0 0 2px' }}>{fmtDate(salaryRange.start)} – {fmtDate(salaryRange.end)}</p>
                    <p style={{ color:t.textDim, fontSize:10, margin:0 }}>Hari kerja: {workdaysInRange(salaryRange.start, salaryRange.end)} hari</p>
                  </div>
                </div>
              )}

              {/* Custom date range — kustom */}
              {salaryFilterMode === 'kustom' && (
                <div>
                  <label style={{ color:t.textMuted, fontSize:10, letterSpacing:1, display:'block', marginBottom:8 }}>RENTANG TANGGAL KUSTOM</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:8 }}>
                    <div>
                      <p style={{ color:t.textDim, fontSize:9, letterSpacing:1, margin:'0 0 4px' }}>DARI</p>
                      <input type="date" value={salaryCustomStart} onChange={e => setSalaryCustomStart(e.target.value)}
                        style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:'7px 10px', color:t.accent, fontFamily:'inherit', fontSize:11 }} />
                    </div>
                    <div style={{ paddingTop:16, color:t.textDim }}>→</div>
                    <div>
                      <p style={{ color:t.textDim, fontSize:9, letterSpacing:1, margin:'0 0 4px' }}>SAMPAI</p>
                      <input type="date" value={salaryCustomEnd} onChange={e => setSalaryCustomEnd(e.target.value)}
                        style={{ background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:'7px 10px', color:t.accent, fontFamily:'inherit', fontSize:11 }} />
                    </div>
                  </div>
                  <p style={{ color:t.textDim, fontSize:10, margin:0 }}>
                    {fmtDate(salaryRange.start)} – {fmtDate(salaryRange.end)} · {workdaysInRange(salaryRange.start, salaryRange.end)} hari kerja
                  </p>
                </div>
              )}

              {/* Summary badge for preset modes */}
              {(salaryFilterMode === 'mingguan' || salaryFilterMode === 'triwulan') && (
                <div style={{
                  background: isDark ? 'rgba(74,240,200,0.06)' : 'rgba(12,174,134,0.06)',
                  border: `1px solid ${t.accent}30`,
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <p style={{ color:t.accent, fontSize:12, fontWeight:700, margin:'0 0 2px' }}>
                      {fmtDate(salaryRange.start)} – {fmtDate(salaryRange.end)}
                    </p>
                    <p style={{ color:t.textDim, fontSize:10, margin:0 }}>
                      {workdaysInRange(salaryRange.start, salaryRange.end)} hari kerja
                    </p>
                  </div>
                  <span style={{ fontSize:22 }}>{salaryFilterMode === 'mingguan' ? '📅' : '🗓️'}</span>
                </div>
              )}
            </div>

            <SectionTitle>GRAFIK GAJI BERSIH</SectionTitle>
            <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:'16px 8px 8px', marginBottom:20, boxShadow:t.shadow }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salaryData.map(e => ({ name: e.name.split(' ')[0], 'Gaji Bersih': e.gajiBersih, 'Potongan': e.potonganAbsen + e.potonganTelat, 'Bonus': e.bonusRajin }))}>
                  <XAxis dataKey="name" tick={{ fill:t.chartText, fontSize:10, fontFamily:"'Space Mono'" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => 'Rp'+Math.round(v/1000)+'k'} tick={{ fill:t.chartText, fontSize:9 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                    <div style={{ background:t.tooltipBg, border:`1px solid ${t.tooltipBorder}`, borderRadius:8, padding:'8px 12px', fontFamily:"'Space Mono',monospace", fontSize:10, boxShadow:t.shadow }}>
                      <p style={{ color:t.textSub, marginBottom:4 }}>{label}</p>
                      {payload.map(p => <p key={p.name} style={{ color:p.color, margin:'2px 0' }}>{p.name}: {fmtRupiah(p.value)}</p>)}
                    </div>
                  ) : null} />
                  <Bar dataKey="Gaji Bersih" fill={t.chartHadir} radius={[4,4,0,0]} />
                  <Bar dataKey="Potongan"    fill={t.chartAbsen} radius={[4,4,0,0]} />
                  <Bar dataKey="Bonus"       fill={t.chartTelat} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <SectionTitle>DETAIL GAJI KARYAWAN</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {salaryData.map(emp => (
                <div key={emp.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, overflow:'hidden', boxShadow:t.shadow }}>
                  <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : t.bgCardAlt, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${t.border}` }}>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <Avatar name={emp.name} size={40} />
                      <div>
                        <p style={{ color:t.text, fontSize:13, fontWeight:700, margin:'0 0 2px' }}>{emp.name}</p>
                        <p style={{ color:t.textMuted, fontSize:10, margin:0 }}>{emp.role} · {emp.tipe_gaji === 'harian' ? '📅 Harian' : '📆 Bulanan'}</p>
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:18, fontWeight:700, margin:'0 0 2px', fontFamily:"'Syne',sans-serif", background:t.gradientAccent, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{fmtRupiah(emp.gajiBersih)}</p>
                      <p style={{ color:t.textDim, fontSize:10, margin:0 }}>Gaji Bersih</p>
                    </div>
                  </div>
                  <div style={{ padding:'10px 16px' }}>
                    {[
                      ['Gaji Pokok', emp.tipe_gaji==='harian' ? `${emp.hariHadir} hari × ${fmtRupiah(emp.gaji_pokok)}` : fmtRupiah(emp.gajiKotor), t.textSub],
                      ['Potongan Absen', `${emp.hariAbsen} hari × ${fmtRupiah(emp.potongan_absen)}`, t.danger],
                      ['Potongan Telat', `${emp.jumlahTelat}× × ${fmtRupiah(emp.potongan_telat)}`, t.warn],
                      ['Bonus Tepat Waktu', `${emp.jumlahRajin}× × ${fmtRupiah(emp.bonus_rajin)}`, t.accent],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${t.border}` }}>
                        <span style={{ color:t.textMuted, fontSize:11 }}>{label}</span>
                        <span style={{ color, fontSize:11 }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 2px', marginTop:4 }}>
                      <span style={{ color:t.textSub, fontSize:12, fontWeight:700 }}>TOTAL BERSIH</span>
                      <span style={{ color:t.accent, fontSize:14, fontWeight:700 }}>{fmtRupiah(emp.gajiBersih)}</span>
                    </div>
                    <div style={{ display:'flex', gap:16, marginTop:8, paddingTop:8, borderTop:`1px solid ${t.border}` }}>
                      {[['Hadir',emp.hariHadir,t.chartHadir],['Absen',emp.hariAbsen,t.danger],['Telat',emp.jumlahTelat,t.warn]].map(([l,v,c]) => (
                        <div key={l} style={{ textAlign:'center' }}>
                          <div style={{ color:c, fontSize:16, fontWeight:700 }}>{v}</div>
                          <div style={{ color:t.textMuted, fontSize:9 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'absensi' && (
          <>
            <SectionTitle>TABEL ABSENSI</SectionTitle>
            {loading ? (
              <div style={{ textAlign:'center', color:t.textDim, padding:40, fontSize:12 }}>Memuat data...</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {employees.map(emp => {
                  const empRecs = records.filter(r => r.employee_id === emp.id)
                  return (
                    <div key={emp.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, overflow:'hidden', boxShadow:t.shadow }}>
                      <div style={{ background: isDark ? 'rgba(255,255,255,0.03)' : t.bgCardAlt, padding:'12px 14px', borderBottom:`1px solid ${t.border}`, display:'flex', gap:10, alignItems:'center' }}>
                        <Avatar name={emp.name} size={32} />
                        <div>
                          <p style={{ color:t.text, fontSize:12, fontWeight:700, margin:'0 0 2px' }}>{emp.name}</p>
                          <p style={{ color:t.textMuted, fontSize:10, margin:0 }}>{emp.role}</p>
                        </div>
                      </div>
                      {empRecs.length === 0 ? (
                        <p style={{ color:t.textDim, fontSize:11, padding:'12px 14px', margin:0 }}>Tidak ada data dalam periode ini.</p>
                      ) : (
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                            <thead>
                              <tr>
                                {['Hari','Tanggal','Masuk','Status','Pulang','Foto'].map(h => (
                                  <th key={h} style={{ padding:'8px 10px', color:t.textDim, fontWeight:400, textAlign:'left', borderBottom:`1px solid ${t.border}`, whiteSpace:'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {empRecs.sort((a,b) => a.tanggal.localeCompare(b.tanggal)).map((r,i) => (
                                <tr key={r.id} style={{ background: i%2===0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.018)') }}>
                                  <td style={{ padding:'8px 10px', color:t.textMuted, whiteSpace:'nowrap' }}>{fmtDay(r.tanggal)}</td>
                                  <td style={{ padding:'8px 10px', color:t.textSub, whiteSpace:'nowrap' }}>{fmtDate(r.tanggal)}</td>
                                  <td style={{ padding:'8px 10px', color: r.jam_masuk ? t.accent : t.textDim }}>{r.jam_masuk || '—'}</td>
                                  <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                                    {r.jam_masuk
                                      ? <span style={{ color: r.status_masuk==='telat' ? t.warn : t.accent, fontSize:10 }}>{r.status_masuk==='telat' ? '⚠️ Telat' : '✓ Tepat'}</span>
                                      : <span style={{ color:t.danger, fontSize:10 }}>❌ Absen</span>
                                    }
                                  </td>
                                  <td style={{ padding:'8px 10px', color: r.jam_pulang ? t.accent : t.textDim }}>{r.jam_pulang || '—'}</td>
                                  <td style={{ padding:'8px 10px' }}>
                                    <div style={{ display:'flex', gap:4 }}>
                                      {r.foto_masuk  && <button onClick={() => setViewPhoto(r.foto_masuk)}  style={{ background:t.accentDim, border:`1px solid ${t.accentBorder}`, color:t.accent, borderRadius:5, padding:'2px 7px', cursor:'pointer', fontFamily:'inherit', fontSize:9 }}>M</button>}
                                      {r.foto_pulang && <button onClick={() => setViewPhoto(r.foto_pulang)} style={{ background:t.accentDim, border:`1px solid ${t.borderInput}`,  color:t.textSub,  borderRadius:5, padding:'2px 7px', cursor:'pointer', fontFamily:'inherit', fontSize:9 }}>P</button>}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'setting' && (
          <SettingTab employees={employees} onRefresh={onRefreshEmployees} />
        )}
      </div>
    </div>
  )
}

// ─── Setting Tab ─────────────────────────────────────────────────────────────
function SettingTab({ employees, onRefresh }) {
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT
  const { upsertEmployee, deleteEmployee } = useEmployees()
  const [editId, setEditId]   = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const blankForm = { emp_code:'', name:'', role:'', pin:'0000', jam_masuk:'08:00', jam_pulang:'17:00', tipe_gaji:'bulanan', gaji_pokok:0, potongan_absen:0, potongan_telat:0, bonus_rajin:0 }

  const startEdit = (emp) => { setForm({ ...emp }); setEditId(emp.id); setShowNew(false); setErr('') }
  const startNew  = () => { setForm({ ...blankForm }); setShowNew(true); setEditId(null); setErr('') }
  const cancel    = () => { setEditId(null); setShowNew(false); setErr('') }

  const save = async () => {
    if (!form.name || !form.emp_code) { setErr('Nama dan kode karyawan wajib diisi.'); return }
    setSaving(true); setErr('')
    try {
      await upsertEmployee(form)
      cancel(); onRefresh()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  const del = async (id, name) => {
    if (!confirm(`Hapus karyawan "${name}"? Data absensi tidak terhapus.`)) return
    try { await deleteEmployee(id); onRefresh() }
    catch(e) { alert(e.message) }
  }

  const inputStyle = { width:'100%', background:t.bgInput, border:`1px solid ${t.borderInput}`, borderRadius:8, padding:'8px 10px', color:t.text, fontFamily:"'Space Mono',monospace", fontSize:12, boxSizing:'border-box' }

  const renderField = ({ label, field, type='text', opts }) => (
    <div key={field} style={{ marginBottom:10 }}>
      <label style={{ color:t.textMuted, fontSize:10, display:'block', marginBottom:4, letterSpacing:1 }}>{label}</label>
      {opts ? (
        <select value={form[field]||''} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} style={inputStyle}>
          {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field]||''} onChange={e=>setForm(f=>({...f,[field]:type==='number'?Number(e.target.value):e.target.value}))} style={inputStyle} />
      )}
    </div>
  )

  const renderEmpForm = () => (
    <div style={{ background:t.bgCard, border:`1px solid ${t.accent}`, borderRadius:14, padding:16, marginBottom:16, boxShadow:t.shadow }}>
      <p style={{ color:t.accent, fontSize:10, letterSpacing:2, marginBottom:14 }}>{showNew ? 'KARYAWAN BARU' : 'EDIT KARYAWAN'}</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ gridColumn:'1/-1' }}>{renderField({ label:"NAMA LENGKAP", field:"name" })}</div>
        {renderField({ label:"KODE (cth: E004)", field:"emp_code" })}
        {renderField({ label:"JABATAN", field:"role" })}
        {renderField({ label:"JAM MASUK", field:"jam_masuk", type:"time" })}
        {renderField({ label:"JAM PULANG", field:"jam_pulang", type:"time" })}
        {renderField({ label:"PIN LOGIN", field:"pin" })}
        {renderField({ label:"TIPE GAJI", field:"tipe_gaji", opts:[{v:'bulanan',l:'Bulanan'},{v:'harian',l:'Harian per hari hadir'}] })}
        <div style={{ gridColumn:'1/-1' }}>
          {renderField({ label:form.tipe_gaji==='harian'?'GAJI PER HARI (Rp)':'GAJI POKOK BULANAN (Rp)', field:"gaji_pokok", type:"number" })}
        </div>
        {renderField({ label:"POTONGAN PER HARI ABSEN (Rp)", field:"potongan_absen", type:"number" })}
        {renderField({ label:"POTONGAN PER KETERLAMBATAN (Rp)", field:"potongan_telat", type:"number" })}
        <div style={{ gridColumn:'1/-1' }}>{renderField({ label:"BONUS PER HARI TEPAT WAKTU (Rp)", field:"bonus_rajin", type:"number" })}</div>
      </div>
      {err && <p style={{ color:t.danger, fontSize:11, marginBottom:10 }}>{err}</p>}
      <div style={{ display:'flex', gap:10, marginTop:4 }}>
        <button onClick={cancel} style={{ flex:1, padding:10, background:'transparent', border:`1px solid ${t.borderInput}`, color:t.textMuted, borderRadius:9, cursor:'pointer', fontFamily:'inherit', fontSize:11 }}>Batal</button>
        <button onClick={save} disabled={saving} style={{ flex:2, padding:10, background:t.accent, color:t.accentText, border:'none', borderRadius:9, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:11, opacity:saving?0.6:1 }}>
          {saving ? 'MENYIMPAN...' : 'SIMPAN'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Tampilan / Theme Section */}
      <p style={{ color:t.accent, fontSize:10, letterSpacing:3, margin:'0 0 12px', fontWeight:700 }}>TAMPILAN</p>
      <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:14, padding:'14px 16px', marginBottom:22, boxShadow:t.shadow }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ color:t.text, fontSize:13, fontWeight:700, margin:'0 0 3px' }}>Mode Tampilan</p>
            <p style={{ color:t.textMuted, fontSize:10, margin:0 }}>Aktif: {isDark ? 'Mode Gelap 🌙' : 'Mode Terang ☀️'}</p>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              background: t.bgCardAlt,
              border:`2px solid ${t.borderInput}`,
              borderRadius:40, padding:'9px 18px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:8,
              color:t.text, fontFamily:"'Space Mono',monospace",
              fontSize:11, fontWeight:700, letterSpacing:1,
              transition:'all 0.2s',
            }}
          >{isDark ? '☀️ TERANG' : '🌙 GELAP'}</button>
        </div>
      </div>

      {/* Karyawan Section */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ color:t.accent, fontSize:10, letterSpacing:2, margin:0 }}>DATA KARYAWAN ({employees.length})</p>
        {!showNew && !editId && (
          <button onClick={startNew} style={{ background:t.accent, color:t.accentText, border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:1 }}>+ TAMBAH</button>
        )}
      </div>

      {showNew && renderEmpForm()}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {employees.map(emp => (
          <div key={emp.id}>
            {editId === emp.id ? renderEmpForm() : (
              <div className="card-lift" style={{ background: isDark ? 'linear-gradient(145deg,rgba(10,10,28,0.98),rgba(7,7,20,0.96))' : '#ffffff', border:`1px solid ${isDark ? 'rgba(255,255,255,0.06)' : t.border}`, borderRadius:16, padding:'14px 16px', boxShadow:t.cardShadow }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1, minWidth:0 }}>
                    <Avatar name={emp.name} size={42} />
                    <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:t.text, fontSize:13, fontWeight:700, margin:'0 0 3px' }}>{emp.name}</p>
                    <p style={{ color:t.textMuted, fontSize:10, margin:'0 0 6px' }}>{emp.role} · {emp.emp_code}</p>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span style={{ color:t.accent,   fontSize:10 }}>⏰ {emp.jam_masuk}–{emp.jam_pulang}</span>
                      <span style={{ color:t.textSub,  fontSize:10 }}>🔑 {emp.pin}</span>
                      <span style={{ color:t.warn,     fontSize:10 }}>{emp.tipe_gaji === 'harian' ? `💵 ${fmtRupiah(emp.gaji_pokok)}/hari` : `💵 ${fmtRupiah(emp.gaji_pokok)}/bln`}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                      {emp.potongan_absen > 0 && <span style={{ color:t.danger, fontSize:9 }}>✂️ Absen: {fmtRupiah(emp.potongan_absen)}</span>}
                      {emp.potongan_telat > 0 && <span style={{ color:t.warn,   fontSize:9 }}>✂️ Telat: {fmtRupiah(emp.potongan_telat)}</span>}
                      {emp.bonus_rajin   > 0 && <span style={{ color:t.accent,  fontSize:9 }}>⭐ Bonus: {fmtRupiah(emp.bonus_rajin)}</span>}
                    </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:10 }}>
                    <button onClick={() => startEdit(emp)} style={{ background:t.accentDim, border:`1px solid ${t.accentBorder}`, color:t.accent, borderRadius:8, padding:'6px 11px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>Edit</button>
                    <button onClick={() => del(emp.id, emp.name)} style={{ background:t.dangerDim, border:`1px solid ${t.dangerBorder}`, color:t.danger, borderRadius:8, padding:'6px 11px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>Hapus</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
