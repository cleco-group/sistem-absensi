import { useState, useEffect } from 'react'
import { useAttendance, useSettings } from '../hooks/useData'
import { todayStr, timeNowStr, fmtDate, fmtDay, isLate, minutesDiff, getDistance, getCurrentPosition } from '../lib/utils'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'
import Camera from './Camera'

const Avatar = ({ name, size = 40 }) => {
  const colors = ['#4af0c8', '#a78bfa', '#fb7185', '#38bdf8', '#fbbf24']
  const idx = name.length % colors.length
  return (
    <div style={{ width:size, height:size, borderRadius:size/2.5, background:colors[idx]+'22', border:`1px solid ${colors[idx]}44`, display:'flex', alignItems:'center', justifyContent:'center', color:colors[idx], fontWeight:700, fontSize:size*0.4 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function EmployeePage({ employee, allEmployees, onLogout }) {
  const today = todayStr()
  const { records, upsertAttendance, loading: loadingAtt } = useAttendance(today, today)
  const { settings } = useSettings()
  const [selected, setSelected] = useState(null)
  const [showCam, setShowCam]   = useState(false)
  const [toast, setToast]       = useState(null)
  const [processing, setProcessing] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

  const getRecord = (id) => records.find(r => r.employee_id === id)
  
  const statusOf = (emp) => {
    const r = getRecord(emp.id)
    if (!r) return 'belum'
    if (r.jam_masuk && !r.jam_pulang) return 'hadir'
    return 'selesai'
  }

  const handleSelect = (emp) => {
    if (statusOf(emp) === 'selesai') return
    setSelected(emp)
    setShowCam(true)
  }

  const handleCapture = async (base64) => {
    setShowCam(false)
    setProcessing(true)
    try {
      // 1. Cek Lokasi jika diatur
      if (settings && settings.lat && settings.lng) {
        setToast({ msg: 'Memverifikasi lokasi...', ok: true })
        const pos = await getCurrentPosition()
        const dist = getDistance(pos.lat, pos.lng, settings.lat, settings.lng)
        
        if (dist > settings.radius) {
          throw new Error(`Anda berada di luar jangkauan (${Math.round(dist)}m). Jarak maksimal ${settings.radius}m.`)
        }
      }

      const now = timeNowStr()
      const rec = getRecord(selected.id)
      const isMasuk = !rec || !rec.jam_masuk

      const payload = {
        employee_id: selected.id,
        tanggal: today,
        [isMasuk ? 'jam_masuk' : 'jam_pulang']: now,
      }

      if (isMasuk) {
        const late = isLate(now, selected.jam_masuk)
        payload.status_masuk = late ? 'telat' : 'tepat'
        payload.menit_telat  = late ? minutesDiff(now, selected.jam_masuk) : 0
      } else {
        payload.status_pulang = 'tepat' // bisa dikembangkan logic pulang awal
      }

      await upsertAttendance(payload, base64)
      setToast({ msg: `Berhasil Absen ${isMasuk ? 'Masuk' : 'Pulang'}!`, ok: true })
    } catch (err) {
      setToast({ msg: err.message || 'Gagal absen. Coba lagi.', ok: false })
    } finally {
      setProcessing(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const displayList = allEmployees.filter(e => e.id === employee.id || employee.role === 'admin')

  const cardBg = {
    belum:   { bg: isDark ? 'rgba(255,255,255,0.03)' : '#fff', border: t.border },
    hadir:   { bg: isDark ? 'rgba(74,240,200,0.08)' : '#f0fdfa', border: isDark ? 'rgba(74,240,200,0.3)' : '#ccfbf1' },
    selesai: { bg: isDark ? 'rgba(255,255,255,0.01)' : '#f9fafb', border: t.borderSub },
  }

  return (
    <div style={{ minHeight:'100vh', background:t.bg, color:t.text, fontFamily:"'Space Mono',monospace", paddingBottom:40 }}>
      {showCam && <Camera onCapture={handleCapture} onClose={() => setShowCam(false)} label={`ABSEN ${!getRecord(selected.id)?.jam_masuk ? 'MASUK' : 'PULANG'}: ${selected.name}`} />}
      
      {/* Header */}
      <div style={{ 
        background: isDark ? 'rgba(10,10,20,0.8)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: isDark ? '0 4px 32px rgba(0,0,0,0.5)' : '0 2px 20px rgba(30,32,60,0.07)',
      }}>
        <div>
          <p style={{ 
            fontSize: 15, letterSpacing: 4, fontFamily: "'Syne',sans-serif", fontWeight: 800, margin: 0,
            background: t.gradientAccent,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>ABSENSI</p>
          <p style={{ color:t.textDim, fontSize:10, marginTop:2 }}>{fmtDay(today)}, {fmtDate(today)}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={toggleTheme} className="btn-lift" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : t.bgCardAlt, border:`1px solid ${isDark ? 'rgba(255,255,255,0.1)' : t.border}`, borderRadius:10, padding:'7px 11px', cursor:'pointer', fontSize:15, lineHeight:1 }}>{isDark ? '☀️' : '🌙'}</button>
          <button onClick={onLogout} className="btn-lift" style={{ background:'transparent', border:`1px solid ${t.borderSub}`, color:t.textMuted, borderRadius:9, padding:'7px 13px', cursor:'pointer', fontFamily:'inherit', fontSize:10, letterSpacing:1 }}>KELUAR</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ margin:'12px 20px 0', background:toast.ok ? t.accentDim : t.dangerDim, border:`1px solid ${toast.ok ? t.accent+'55' : t.danger+'55'}`, borderRadius:13, padding:'12px 16px', color:toast.ok ? t.accent : t.danger, fontSize:12, textAlign:'center', animation:'slide-up 0.2s ease', backdropFilter:'blur(10px)' }}>
          {toast.msg}
        </div>
      )}

      {processing && (
        <div style={{ margin:'12px 20px 0', background:t.accentDim, borderRadius:13, padding:'12px 16px', color:t.accent, fontSize:11, textAlign:'center' }}>
          SEDANG MEMPROSES... MOHON TUNGGU
        </div>
      )}

      {/* List */}
      <div style={{ padding:20 }}>
        <p style={{ color:t.textMuted, fontSize:10, letterSpacing:2, marginBottom:16 }}>PILIH KARYAWAN</p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {displayList.map(emp => {
            const status = statusOf(emp)
            const rec = getRecord(emp.id)
            const cs = cardBg[status]
            const aColor = '#4af0c8'
            return (
              <button
                key={emp.id}
                onClick={() => handleSelect(emp)}
                disabled={processing}
                className={status !== 'selesai' ? 'card-lift' : ''}
                style={{
                  background: isDark ? cs.bg : (status === 'belum' ? '#ffffff' : cs.bg),
                  backdropFilter: isDark ? 'blur(10px)' : 'none',
                  WebkitBackdropFilter: isDark ? 'blur(10px)' : 'none',
                  border: `1px solid ${cs.border}`,
                  borderRadius: 18, padding: '16px 18px',
                  cursor: status === 'selesai' || processing ? 'default' : 'pointer',
                  textAlign: 'left',
                  opacity: status === 'selesai' ? 0.62 : 1,
                  boxShadow: isDark 
                    ? `0 4px 24px rgba(0,0,0,0.32)${status === 'hadir' ? `, 0 0 24px ${aColor}18` : ''}`
                    : `${t.cardShadow}${status === 'hadir' ? `, 0 0 18px ${aColor}18` : ''}`,
                }}
              >
                <div style={{ display:'flex', gap:14, alignItems:'center' }}>
                  <Avatar name={emp.name} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:t.text, fontSize:14, fontWeight:700, margin:'0 0 2px' }}>{emp.name}</p>
                    <p style={{ color:t.textMuted, fontSize:10, margin:'0 0 8px' }}>{emp.role} · {emp.jam_masuk}–{emp.jam_pulang}</p>
                    {rec?.jam_masuk ? (
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ 
                          background: rec.status_masuk === 'telat' ? t.warnDim : t.accentDim,
                          color: rec.status_masuk === 'telat' ? t.warn : t.accent,
                          border: `1px solid ${rec.status_masuk === 'telat' ? t.warn+'45' : t.accent+'45'}`,
                          borderRadius: 20, padding: '3px 10px', fontSize: 10,
                        }}>
                          {rec.status_masuk === 'telat' ? '⚠️ Telat' : '✓ Tepat'} {rec.jam_masuk}
                        </span>
                        {rec.jam_pulang && (
                          <span style={{ color:t.textMuted, fontSize:10 }}>· Pulang {rec.jam_pulang}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color:t.textDim, fontSize:10 }}>Belum absen</span>
                    )}
                  </div>
                  <div style={{ fontSize:22, flexShrink:0 }}>
                    {status === 'selesai' ? '✅' : status === 'hadir' ? '🟡' : '⬜'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
