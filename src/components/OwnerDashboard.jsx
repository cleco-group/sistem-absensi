import { useState, useMemo } from 'react'
import { useEmployees, useAttendance, useOutlets, useAuditLogs } from '../hooks/useData'
import { monthRange, weekRange, fmtMonth, fmtRupiah, hitungGaji, getCurrentPosition, todayStr } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts'

const Avatar = ({ name, size = 40 }) => {
  const colors = ['#4af0c8', '#a78bfa', '#fb7185', '#38bdf8', '#fbbf24']
  const idx = name.length % colors.length
  return (
    <div style={{ width:size, height:size, borderRadius:size/2.5, background:colors[idx]+'22', border:`1px solid ${colors[idx]}44`, display:'flex', alignItems:'center', justifyContent:'center', color:colors[idx], fontWeight:700, fontSize:size*0.4 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

const StatCard = ({ label, value, color }) => {
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT
  return (
    <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:16, textAlign:'center' }}>
      <p style={{ fontSize:9, color:t.textMuted, marginBottom:8, letterSpacing:1 }}>{label}</p>
      <p style={{ fontSize:20, fontWeight:800, color:color, margin:0 }}>{value}</p>
    </div>
  )
}

export default function OwnerDashboard({ onLogout }) {
  const [tab, setTab] = useState('ringkasan')
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div style={{ minHeight:'100vh', background:t.bg, color:t.text, fontFamily:"'Space Mono',monospace" }}>
      {/* Header */}
      <div style={{ background:t.bgCard, borderBottom:`1px solid ${t.border}`, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <p style={{ fontSize:14, letterSpacing:4, fontWeight:800, margin:0, background:t.gradientAccent, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>OWNER PANEL</p>
          <p style={{ color:t.textMuted, fontSize:10, marginTop:2 }}>MANAJEMEN SISTEM</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={toggleTheme} style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>{isDark ? '☀️' : '🌙'}</button>
          <button onClick={onLogout} style={{ background:'transparent', border:`1px solid ${t.dangerBorder}`, color:t.danger, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:10 }}>KELUAR</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:t.bgCard, borderBottom:`1px solid ${t.border}`, overflowX:'auto' }}>
        {['ringkasan', 'karyawan', 'outlet', 'absensi', 'gaji', 'log'].map(id => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, minWidth:100, padding:'14px 0', background:'none', border:'none', borderBottom:tab === id ? `2px solid ${t.accent}` : 'none', color:tab === id ? t.accent : t.textMuted, fontSize:10, fontWeight:tab === id ? 700 : 400, cursor:'pointer', letterSpacing:1 }}>{id.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ padding:20 }}>
        {tab === 'ringkasan' && <RingkasanTab />}
        {tab === 'karyawan' && <KaryawanTab />}
        {tab === 'outlet' && <OutletTab />}
        {tab === 'absensi' && <AbsensiTab />}
        {tab === 'gaji' && <GajiTab />}
        {tab === 'log' && <LogTab />}
      </div>
    </div>
  )
}

function RingkasanTab() {
  const today = todayStr()
  const { employees } = useEmployees()
  const { outlets } = useOutlets()
  const [filterType, setFilterType] = useState('hari')
  const [customStart, setCustomStart] = useState(today)
  const [customEnd, setCustomEnd] = useState(today)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const getDateRange = () => {
    switch (filterType) {
      case 'hari':
        return { start: today, end: today }
      case 'minggu':
        return weekRange()
      case 'bulan':
        return monthRange()
      case 'custom':
        return { start: customStart, end: customEnd }
      default:
        return { start: today, end: today }
    }
  }

  const dateRange = getDateRange()
  const { records } = useAttendance(dateRange.start, dateRange.end)

  const stats = useMemo(() => {
    const hadir = records.filter(r => r.jam_masuk).length
    const telat = records.filter(r => r.status_masuk === 'telat').length
    const belum = employees.length - hadir
    return { hadir, telat, belum, total: employees.length }
  }, [employees, records])

  const pieData = [
    { name: 'Hadir Tepat', value: stats.hadir - stats.telat, color: t.chartHadir },
    { name: 'Hadir Telat', value: stats.telat, color: t.chartTelat },
    { name: 'Belum Absen', value: stats.belum, color: t.chartAbsen },
  ]

  const outletStats = useMemo(() => {
    return outlets.map(o => {
      const empInOutlet = employees.filter(e => e.outlet_id === o.id)
      const hadir = records.filter(r => empInOutlet.some(e => e.id === r.employee_id) && r.jam_masuk).length
      return { name: o.name, hadir, total: empInOutlet.length }
    })
  }, [outlets, employees, records])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <p style={{ color:t.accent, fontSize:11, fontWeight:700, margin:0 }}>RINGKASAN</p>
      </div>

      {/* Filter Buttons */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {['hari', 'minggu', 'bulan', 'custom'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding:'8px 14px',
              borderRadius:8,
              border:`1px solid ${filterType === type ? t.accent : t.border}`,
              background:filterType === type ? t.accentDim : 'transparent',
              color:filterType === type ? t.accent : t.textMuted,
              fontSize:10,
              fontWeight:filterType === type ? 700 : 400,
              cursor:'pointer',
              textTransform:'uppercase',
              letterSpacing:0.5,
            }}
          >
            {type === 'hari' ? 'HARI INI' : type === 'minggu' ? 'MINGGU INI' : type === 'bulan' ? 'BULAN INI' : 'CUSTOM'}
          </button>
        ))}
      </div>

      {/* Custom Date Range Inputs */}
      {filterType === 'custom' && (
        <div style={{ display:'flex', gap:10, marginBottom:20 }}>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            style={{ flex:1, padding:10, borderRadius:8, background:t.bgCard, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }}
          />
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            style={{ flex:1, padding:10, borderRadius:8, background:t.bgCard, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }}
          />
        </div>
      )}

      {/* Period Display */}
      <p style={{ color:t.textMuted, fontSize:9, marginBottom:20, letterSpacing:0.5 }}>
        PERIODE: {dateRange.start} s/d {dateRange.end}
      </p>
      
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24 }}>
        <StatCard label="HADIR" value={stats.hadir} color={t.accent} />
        <StatCard label="TELAT" value={stats.telat} color={t.warn} />
        <StatCard label="BELUM ABSEN" value={stats.belum} color={t.textMuted} />
        <StatCard label="TOTAL KARYAWAN" value={stats.total} color={t.text} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20, marginBottom:20 }}>
        {/* Pie Chart: Status Kehadiran */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:20, padding:20 }}>
          <p style={{ fontSize:10, fontWeight:700, color:t.textMuted, marginBottom:16, letterSpacing:1 }}>PROPORSI KEHADIRAN</p>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ background:t.tooltipBg, border:`1px solid ${t.tooltipBorder}`, borderRadius:8, fontSize:10 }}
                  itemStyle={{ color:t.text }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize:10, color:t.textMuted }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Kehadiran per Outlet */}
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:20, padding:20 }}>
          <p style={{ fontSize:10, fontWeight:700, color:t.textMuted, marginBottom:16, letterSpacing:1 }}>KEHADIRAN PER OUTLET</p>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outletStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill:t.textMuted, fontSize:9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill:t.textMuted, fontSize:9 }} />
                <Tooltip 
                  cursor={{ fill:t.bgCardAlt }}
                  contentStyle={{ background:t.tooltipBg, border:`1px solid ${t.tooltipBorder}`, borderRadius:8, fontSize:10 }}
                />
                <Bar dataKey="hadir" fill={t.accent} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}


function KaryawanTab() {
  const { employees, upsertEmployee, deleteEmployee } = useEmployees()
  const { outlets } = useOutlets()
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd.entries())
    // Ensure numeric values
    data.gaji_pokok = Number(data.gaji_pokok)
    data.potongan_absen = Number(data.potongan_absen)
    data.potongan_telat = Number(data.potongan_telat)
    data.bonus_rajin = Number(data.bonus_rajin)
    
    await upsertEmployee({ ...editData, ...data })
    setShowForm(false)
    setEditData(null)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <p style={{ color:t.accent, fontSize:11, fontWeight:700 }}>DAFTAR KARYAWAN</p>
        <button onClick={() => setShowForm(true)} style={{ background:t.accent, color:t.accentText, border:'none', borderRadius:8, padding:'8px 16px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ TAMBAH</button>
      </div>

      {showForm && (
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <input name="name" defaultValue={editData?.name} placeholder="Nama Lengkap" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              <input name="emp_code" defaultValue={editData?.emp_code} placeholder="Kode (E001)" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <input name="role" defaultValue={editData?.role} placeholder="Jabatan" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              <input name="pin" defaultValue={editData?.pin} placeholder="PIN (6 Digit)" required maxLength={6} style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            </div>
            
            <select name="outlet_id" defaultValue={editData?.outlet_id} required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }}>
              <option value="">Pilih Outlet</option>
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:9, color:t.textMuted }}>JAM MASUK</label>
                <input name="jam_masuk" type="time" defaultValue={editData?.jam_masuk || '08:00'} required style={{ width:'100%', padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              </div>
              <div>
                <label style={{ fontSize:9, color:t.textMuted }}>JAM PULANG</label>
                <input name="jam_pulang" type="time" defaultValue={editData?.jam_pulang || '17:00'} required style={{ width:'100%', padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <select name="tipe_gaji" defaultValue={editData?.tipe_gaji || 'bulanan'} style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }}>
                <option value="bulanan">Bulanan</option>
                <option value="harian">Harian</option>
              </select>
              <input name="gaji_pokok" type="number" defaultValue={editData?.gaji_pokok || 0} placeholder="Gaji Pokok" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
              <input name="potongan_absen" type="number" defaultValue={editData?.potongan_absen || 0} placeholder="Pot. Absen" style={{ padding:10, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
              <input name="potongan_telat" type="number" defaultValue={editData?.potongan_telat || 0} placeholder="Pot. Telat" style={{ padding:10, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
              <input name="bonus_rajin" type="number" defaultValue={editData?.bonus_rajin || 0} placeholder="Bonus Rajin" style={{ padding:10, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
            </div>

            <div style={{ display:'flex', gap:10, marginTop:10 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:12, borderRadius:8, background:'none', border:`1px solid ${t.border}`, color:t.text }}>BATAL</button>
              <button type="submit" style={{ flex:2, padding:12, borderRadius:8, background:t.accent, color:t.accentText, border:'none', fontWeight:700 }}>SIMPAN KARYAWAN</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {employees.map(emp => (
          <div key={emp.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
                <Avatar name={emp.name} />
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{emp.name}</p>
                  <p style={{ fontSize:10, color:t.textMuted, margin:0 }}>{emp.role} · {emp.outlets?.name || 'No Outlet'}</p>
                  <p style={{ fontSize:9, color:t.accent, margin:'4px 0 0' }}>{fmtRupiah(emp.gaji_pokok)} ({emp.tipe_gaji})</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setEditData(emp); setShowForm(true) }} style={{ background:t.accentDim, color:t.accent, border:'none', borderRadius:6, padding:'6px 10px', fontSize:10, whiteSpace:'nowrap' }}>Edit</button>
                <button onClick={() => deleteEmployee(emp.id)} style={{ background:t.dangerDim, color:t.danger, border:'none', borderRadius:6, padding:'6px 10px', fontSize:10, whiteSpace:'nowrap' }}>Hapus</button>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, paddingTop:12, borderTop:`1px solid ${t.border}` }}>
              <div>
                <p style={{ fontSize:8, color:t.textMuted, margin:'0 0 4px', letterSpacing:0.5 }}>POT. ABSEN</p>
                <p style={{ fontSize:11, fontWeight:600, margin:0, color:t.text }}>{fmtRupiah(emp.potongan_absen || 0)}</p>
              </div>
              <div>
                <p style={{ fontSize:8, color:t.textMuted, margin:'0 0 4px', letterSpacing:0.5 }}>POT. TELAT</p>
                <p style={{ fontSize:11, fontWeight:600, margin:0, color:t.text }}>{fmtRupiah(emp.potongan_telat || 0)}</p>
              </div>
              <div>
                <p style={{ fontSize:8, color:t.textMuted, margin:'0 0 4px', letterSpacing:0.5 }}>BONUS RAJIN</p>
                <p style={{ fontSize:11, fontWeight:600, margin:0, color:t.accent }}>{fmtRupiah(emp.bonus_rajin || 0)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OutletTab() {
  const { outlets, upsertOutlet, deleteOutlet } = useOutlets()
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const handleSetCurrentLocation = async () => {
    try {
      const pos = await getCurrentPosition()
      const form = document.getElementById('outlet-form')
      form.lat.value = pos.lat
      form.lng.value = pos.lng
    } catch (err) {
      alert('Gagal mengambil lokasi: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd.entries())
    data.lat = Number(data.lat)
    data.lng = Number(data.lng)
    data.radius = Number(data.radius)
    await upsertOutlet({ ...editData, ...data })
    setShowForm(false)
    setEditData(null)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <p style={{ color:t.accent, fontSize:11, fontWeight:700 }}>MANAJEMEN OUTLET</p>
        <button onClick={() => setShowForm(true)} style={{ background:t.accent, color:t.accentText, border:'none', borderRadius:8, padding:'8px 16px', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ OUTLET</button>
      </div>

      {showForm && (
        <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <form id="outlet-form" onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input name="name" defaultValue={editData?.name} placeholder="Nama Outlet" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            <input name="address" defaultValue={editData?.address} placeholder="Alamat" style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <input name="lat" type="number" step="any" defaultValue={editData?.lat} placeholder="Latitude" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              <input name="lng" type="number" step="any" defaultValue={editData?.lng} placeholder="Longitude" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            </div>
            <input name="radius" type="number" defaultValue={editData?.radius || 100} placeholder="Radius (Meter)" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            
            <button type="button" onClick={handleSetCurrentLocation} style={{ padding:10, borderRadius:8, background:t.bgCardAlt, border:`1px solid ${t.border}`, color:t.text, fontSize:10 }}>📍 GUNAKAN LOKASI SAYA SAAT INI</button>

            <div style={{ display:'flex', gap:10, marginTop:10 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:12, borderRadius:8, background:'none', border:`1px solid ${t.border}`, color:t.text }}>BATAL</button>
              <button type="submit" style={{ flex:2, padding:12, borderRadius:8, background:t.accent, color:t.accentText, border:'none', fontWeight:700 }}>SIMPAN OUTLET</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {outlets.map(o => (
          <div key={o.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <p style={{ fontSize:14, fontWeight:700, margin:0 }}>{o.name}</p>
                <p style={{ fontSize:10, color:t.textMuted, margin:'4px 0' }}>{o.address || 'No Address'}</p>
                <p style={{ fontSize:9, color:t.accent, margin:0 }}>📍 {o.lat}, {o.lng} (Radius: {o.radius}m)</p>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setEditData(o); setShowForm(true) }} style={{ background:t.accentDim, color:t.accent, border:'none', borderRadius:6, padding:'6px 10px', fontSize:10 }}>Edit</button>
                <button onClick={() => deleteOutlet(o.id)} style={{ background:t.dangerDim, color:t.danger, border:'none', borderRadius:6, padding:'6px 10px', fontSize:10 }}>Hapus</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AbsensiTab() {
  const [dateRange, setDateRange] = useState(monthRange())
  const { records, updateAttendance } = useAttendance(dateRange.start, dateRange.end)
  const { addLog } = useAuditLogs()
  const [editData, setEditData] = useState(null)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const handleUpdate = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd.entries())
    try {
      await updateAttendance(editData.id, data)
      await addLog({
        user_role: 'owner',
        action: 'update',
        table_name: 'attendance',
        record_id: editData.id,
        old_data: { jam_masuk: editData.jam_masuk, jam_pulang: editData.jam_pulang, status_masuk: editData.status_masuk },
        new_data: data
      })
      setEditData(null)
    } catch (err) {
      alert('Gagal update: ' + err.message)
    }
  }

  const exportCSV = () => {
    const headers = ['Nama', 'Outlet', 'Tanggal', 'Jam Masuk', 'Status Masuk', 'Jam Pulang']
    const rows = records.map(r => [
      r.employees?.name,
      r.employees?.outlets?.name || '-',
      r.tanggal,
      r.jam_masuk || '-',
      r.status_masuk || '-',
      r.jam_pulang || '-'
    ])
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `absensi_${dateRange.start}_${dateRange.end}.csv`)
    link.click()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <p style={{ color:t.accent, fontSize:11, fontWeight:700 }}>LOG ABSENSI</p>
        <button onClick={exportCSV} style={{ background:t.bgCardAlt, color:t.text, border:`1px solid ${t.border}`, borderRadius:8, padding:'6px 12px', fontSize:10, cursor:'pointer' }}>📥 EKSPOR CSV</button>
      </div>
      
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} style={{ flex:1, padding:10, borderRadius:8, background:t.bgCard, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
        <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} style={{ flex:1, padding:10, borderRadius:8, background:t.bgCard, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
      </div>

      {editData && (
        <div style={{ background:t.bgCard, border:`1px solid ${t.accent}`, borderRadius:16, padding:20, marginBottom:20 }}>
          <p style={{ fontSize:11, fontWeight:700, color:t.accent, marginBottom:12 }}>EDIT ABSENSI: {editData.employees?.name}</p>
          <form onSubmit={handleUpdate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={{ fontSize:9, color:t.textMuted }}>JAM MASUK</label>
                <input name="jam_masuk" type="time" defaultValue={editData.jam_masuk} style={{ width:'100%', padding:10, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              </div>
              <div>
                <label style={{ fontSize:9, color:t.textMuted }}>JAM PULANG</label>
                <input name="jam_pulang" type="time" defaultValue={editData.jam_pulang} style={{ width:'100%', padding:10, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize:9, color:t.textMuted }}>STATUS MASUK</label>
              <select name="status_masuk" defaultValue={editData.status_masuk} style={{ width:'100%', padding:10, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }}>
                <option value="tepat">Tepat Waktu</option>
                <option value="telat">Terlambat</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:10, marginTop:10 }}>
              <button type="button" onClick={() => setEditData(null)} style={{ flex:1, padding:12, borderRadius:8, background:'none', border:`1px solid ${t.border}`, color:t.text, fontSize:11 }}>BATAL</button>
              <button type="submit" style={{ flex:2, padding:12, borderRadius:8, background:t.accent, color:t.accentText, border:'none', fontWeight:700, fontSize:11 }}>SIMPAN PERUBAHAN</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {records.map(r => (
          <div key={r.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <div>
                <p style={{ fontSize:12, fontWeight:700, margin:0 }}>{r.employees?.name}</p>
                <p style={{ fontSize:9, color:t.textMuted, margin:0 }}>{r.employees?.outlets?.name || 'No Outlet'}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ fontSize:10, color:t.textMuted, margin:0 }}>{r.tanggal}</p>
                <button onClick={() => setEditData(r)} style={{ background:'none', border:'none', color:t.accent, fontSize:9, cursor:'pointer', padding:0, marginTop:4 }}>EDIT</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:9, color:t.textMuted, margin:'0 0 4px' }}>MASUK</p>
                <p style={{ fontSize:11, margin:0 }}>{r.jam_masuk || '--:--'} <span style={{ color:r.status_masuk === 'telat' ? t.warn : t.accent }}>({r.status_masuk})</span></p>
                {r.foto_masuk && <a href={r.foto_masuk} target="_blank" rel="noreferrer" style={{ fontSize:9, color:t.accent }}>Lihat Foto</a>}
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:9, color:t.textMuted, margin:'0 0 4px' }}>PULANG</p>
                <p style={{ fontSize:11, margin:0 }}>{r.jam_pulang || '--:--'}</p>
                {r.foto_pulang && <a href={r.foto_pulang} target="_blank" rel="noreferrer" style={{ fontSize:9, color:t.accent }}>Lihat Foto</a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GajiTab() {
  const [dateRange, setDateRange] = useState(monthRange())
  const { employees } = useEmployees()
  const { records } = useAttendance(dateRange.start, dateRange.end)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div>
      <p style={{ color:t.accent, fontSize:11, fontWeight:700, marginBottom:20 }}>REKAP GAJI</p>
      <div style={{ display:'flex', gap:10, marginBottom:20 }}>
        <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} style={{ flex:1, padding:10, borderRadius:8, background:t.bgCard, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
        <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} style={{ flex:1, padding:10, borderRadius:8, background:t.bgCard, border:`1px solid ${t.border}`, color:t.text, fontSize:11 }} />
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {employees.map(emp => {
          const empRecs = records.filter(r => r.employee_id === emp.id)
          const gaji = hitungGaji(emp, empRecs, dateRange.start, dateRange.end)
          return (
            <div key={emp.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{emp.name}</p>
                  <p style={{ fontSize:9, color:t.textMuted, margin:0 }}>{emp.outlets?.name || 'No Outlet'}</p>
                </div>
                <p style={{ fontSize:14, fontWeight:800, color:t.accent, margin:0 }}>{fmtRupiah(gaji.gajiBersih)}</p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:10, color:t.textMuted }}>
                <p style={{ margin:0 }}>Hadir: {gaji.hariHadir}/{gaji.hariKerja} hari</p>
                <p style={{ margin:0 }}>Telat: {gaji.jumlahTelat}x</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LogTab() {
  const { logs } = useAuditLogs()
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div>
      <p style={{ color:t.accent, fontSize:11, fontWeight:700, marginBottom:20 }}>AUDIT LOG</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {logs.map(l => (
          <div key={l.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:10, fontWeight:700, color:t.accent }}>{l.action.toUpperCase()}</span>
              <span style={{ fontSize:9, color:t.textMuted }}>{new Date(l.created_at).toLocaleString('id-ID')}</span>
            </div>
            <p style={{ fontSize:11, margin:'0 0 4px' }}>
              <span style={{ color:t.textMuted }}>User:</span> {l.user_role} 
              {l.user_id && ` (${l.user_id})`}
            </p>
            <p style={{ fontSize:11, margin:0 }}>
              <span style={{ color:t.textMuted }}>Tabel:</span> {l.table_name}
            </p>
            {l.new_data && (
              <div style={{ marginTop:8, padding:8, background:t.bg, borderRadius:6, fontSize:9, overflowX:'auto' }}>
                <pre style={{ margin:0 }}>{JSON.stringify(l.new_data, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
