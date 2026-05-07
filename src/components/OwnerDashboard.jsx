import { useState } from 'react'
import { useEmployees, useAttendance, useSettings } from '../hooks/useData'
import { monthRange, fmtMonth, fmtRupiah, hitungGaji, getCurrentPosition } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'

const Avatar = ({ name, size = 40 }) => {
  const colors = ['#4af0c8', '#a78bfa', '#fb7185', '#38bdf8', '#fbbf24']
  const idx = name.length % colors.length
  return (
    <div style={{ width:size, height:size, borderRadius:size/2.5, background:colors[idx]+'22', border:`1px solid ${colors[idx]}44`, display:'flex', alignItems:'center', justifyContent:'center', color:colors[idx], fontWeight:700, fontSize:size*0.4 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function OwnerDashboard({ onLogout }) {
  const [tab, setTab] = useState('karyawan')
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
      <div style={{ display:'flex', background:t.bgCard, borderBottom:`1px solid ${t.border}` }}>
        {['karyawan', 'absensi', 'gaji', 'pengaturan'].map(id => (
          <button key={id} onClick={() => setTab(id)} style={{ flex:1, padding:'14px 0', background:'none', border:'none', borderBottom:tab === id ? `2px solid ${t.accent}` : 'none', color:tab === id ? t.accent : t.textMuted, fontSize:10, fontWeight:tab === id ? 700 : 400, cursor:'pointer', letterSpacing:1 }}>{id.toUpperCase()}</button>
        ))}
      </div>

      <div style={{ padding:20 }}>
        {tab === 'karyawan' && <KaryawanTab />}
        {tab === 'absensi' && <AbsensiTab />}
        {tab === 'gaji' && <GajiTab />}
        {tab === 'pengaturan' && <SettingsTab />}
      </div>
    </div>
  )
}

function KaryawanTab() {
  const { employees, upsertEmployee, deleteEmployee } = useEmployees()
  const [showForm, setShowForm] = useState(false)
  const [editData, setEditData] = useState(null)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    const data = Object.fromEntries(fd.entries())
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
            <input name="name" defaultValue={editData?.name} placeholder="Nama Lengkap" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            <input name="emp_code" defaultValue={editData?.emp_code} placeholder="Kode Karyawan (E001)" required style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            <input name="pin" defaultValue={editData?.pin} placeholder="PIN (6 Digit)" required maxLength={6} style={{ padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text }} />
            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:12, borderRadius:8, background:'none', border:`1px solid ${t.border}`, color:t.text }}>BATAL</button>
              <button type="submit" style={{ flex:2, padding:12, borderRadius:8, background:t.accent, color:t.accentText, border:'none', fontWeight:700 }}>SIMPAN</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {employees.map(emp => (
          <div key={emp.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <Avatar name={emp.name} />
              <div>
                <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{emp.name}</p>
                <p style={{ fontSize:10, color:t.textMuted, margin:0 }}>{emp.role} · {emp.emp_code}</p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setEditData(emp); setShowForm(true) }} style={{ background:t.accentDim, color:t.accent, border:'none', borderRadius:6, padding:'6px 10px', fontSize:10 }}>Edit</button>
              <button onClick={() => deleteEmployee(emp.id)} style={{ background:t.dangerDim, color:t.danger, border:'none', borderRadius:6, padding:'6px 10px', fontSize:10 }}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AbsensiTab() {
  const range = monthRange()
  const { records } = useAttendance(range.start, range.end)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div>
      <p style={{ color:t.accent, fontSize:11, fontWeight:700, marginBottom:20 }}>LOG ABSENSI BULAN INI</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {records.map(r => (
          <div key={r.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:12, padding:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <p style={{ fontSize:12, fontWeight:700, margin:0 }}>{r.employees?.name}</p>
              <p style={{ fontSize:10, color:t.textMuted, margin:0 }}>{r.tanggal}</p>
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
  const range = monthRange()
  const { employees } = useEmployees()
  const { records } = useAttendance(range.start, range.end)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  return (
    <div>
      <p style={{ color:t.accent, fontSize:11, fontWeight:700, marginBottom:20 }}>REKAP GAJI: {fmtMonth(range.start)}</p>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {employees.map(emp => {
          const empRecs = records.filter(r => r.employee_id === emp.id)
          const gaji = hitungGaji(emp, empRecs, range.start, range.end)
          return (
            <div key={emp.id} style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:700, margin:0 }}>{emp.name}</p>
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

function SettingsTab() {
  const { settings, updateSettings, loading } = useSettings()
  const [saving, setSaving] = useState(false)
  const { isDark } = useTheme()
  const t = isDark ? DARK : LIGHT

  const handleSetCurrentLocation = async () => {
    try {
      const pos = await getCurrentPosition()
      const form = document.getElementById('settings-form')
      form.lat.value = pos.lat
      form.lng.value = pos.lng
    } catch (err) {
      alert('Gagal mengambil lokasi: ' + err.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.target)
    const data = {
      lat: Number(fd.get('lat')),
      lng: Number(fd.get('lng')),
      radius: Number(fd.get('radius'))
    }
    try {
      await updateSettings(data)
      alert('Pengaturan berhasil disimpan!')
    } catch (err) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Memuat pengaturan...</p>

  return (
    <div>
      <p style={{ color:t.accent, fontSize:11, fontWeight:700, marginBottom:20 }}>PENGATURAN LOKASI ABSENSI</p>
      <div style={{ background:t.bgCard, border:`1px solid ${t.border}`, borderRadius:16, padding:20 }}>
        <form id="settings-form" onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:10, color:t.textMuted, display:'block', marginBottom:6 }}>LATITUDE</label>
            <input name="lat" defaultValue={settings?.lat} step="any" type="number" required style={{ width:'100%', padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text, boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:10, color:t.textMuted, display:'block', marginBottom:6 }}>LONGITUDE</label>
            <input name="lng" defaultValue={settings?.lng} step="any" type="number" required style={{ width:'100%', padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text, boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:10, color:t.textMuted, display:'block', marginBottom:6 }}>RADIUS JANGKAUAN (METER)</label>
            <input name="radius" defaultValue={settings?.radius} type="number" required style={{ width:'100%', padding:12, borderRadius:8, background:t.bg, border:`1px solid ${t.border}`, color:t.text, boxSizing:'border-box' }} />
          </div>
          
          <button type="button" onClick={handleSetCurrentLocation} style={{ padding:12, borderRadius:8, background:t.bgCardAlt, border:`1px solid ${t.border}`, color:t.text, cursor:'pointer', fontSize:11 }}>📍 GUNAKAN LOKASI SAYA SAAT INI</button>
          
          <button type="submit" disabled={saving} style={{ padding:14, borderRadius:8, background:t.accent, color:t.accentText, border:'none', fontWeight:700, cursor:'pointer', opacity:saving?0.6:1 }}>{saving ? 'MENYIMPAN...' : 'SIMPAN PENGATURAN'}</button>
        </form>
      </div>
      <p style={{ fontSize:10, color:t.textMuted, marginTop:16, lineHeight:1.5 }}>* Karyawan hanya dapat melakukan absensi jika berada dalam radius yang ditentukan dari titik koordinat di atas.</p>
    </div>
  )
}
