import { useState } from 'react'
import Camera from './Camera'
import { todayStr, timeNowStr, isLate, isEarly, fmtDate, fmtDay } from '../lib/utils'
import { useAttendance } from '../hooks/useData'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'

const AVATAR_COLORS = ['#4af0c8','#00c8ff','#ff6b9d','#a78bfa','#ffaa44','#34d399','#f87171']
const getAvatarColor = name => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
const getInitials    = name => name.split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('').toUpperCase()

const Avatar = ({ name, size = 44 }) => {
  const color = getAvatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}22, ${color}44)`,
      border: `1.5px solid ${color}65`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color,
      flexShrink: 0, fontFamily: "'Syne',sans-serif",
      boxShadow: `0 0 18px ${color}2a`,
    }}>{getInitials(name)}</div>
  )
}

export default function EmployeePage({ employee, allEmployees, onLogout }) {
  const today = todayStr()
  const { records, upsertAttendance } = useAttendance(today, today)
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

  const [step, setStep]         = useState('list')
  const [selected, setSelected] = useState(null)
  const [photo, setPhoto]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const getRecord = empId => records.find(r => r.employee_id === empId)

  const statusOf = emp => {
    const r = getRecord(emp.id)
    if (!r?.jam_masuk) return 'belum'
    if (r.jam_masuk && !r.jam_pulang) return 'hadir'
    return 'selesai'
  }

  const handleSelect = emp => {
    const s = statusOf(emp)
    if (s === 'selesai') { showToast(`${emp.name} sudah absen pulang hari ini.`, false); return }
    setSelected({ emp, mode: s === 'hadir' ? 'pulang' : 'masuk' })
    setStep('camera')
  }

  const handleCapture = img => { setPhoto(img); setStep('preview') }

  const handleConfirm = async () => {
    setSaving(true)
    const { emp, mode } = selected
    const time = timeNowStr()
    const existing = getRecord(emp.id) || {}
    const payload = {
      employee_id: emp.id,
      tanggal: today,
      ...(mode === 'masuk' ? {
        jam_masuk: time, foto_masuk: photo,
        status_masuk: isLate(time, emp.jam_masuk) ? 'telat' : 'tepat',
        menit_telat: Math.max(0, parseInt(time.replace(':','')) - parseInt(emp.jam_masuk.replace(':','')))
      } : {
        jam_pulang: time, foto_pulang: photo,
        status_pulang: isEarly(time, emp.jam_pulang) ? 'lebih_awal' : 'tepat',
        jam_masuk: existing.jam_masuk, foto_masuk: existing.foto_masuk,
        status_masuk: existing.status_masuk, menit_telat: existing.menit_telat
      })
    }
    try {
      await upsertAttendance(payload)
      const telat = mode === 'masuk' && isLate(time, emp.jam_masuk)
      showToast(`✓ Absen ${mode} ${emp.name} — ${time}${telat ? ' (terlambat)' : ''}`)
    } catch {
      showToast('Gagal menyimpan. Cek koneksi.', false)
    }
    setSaving(false); setStep('list'); setPhoto(null); setSelected(null)
  }

  const displayList = employee ? [employee] : allEmployees

  const cardBg = {
    belum:  { bg: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',              border: isDark ? 'rgba(255,255,255,0.07)' : t.border },
    hadir:  { bg: isDark ? 'rgba(74,240,200,0.05)'  : 'rgba(12,174,134,0.04)', border: isDark ? 'rgba(74,240,200,0.22)' : 'rgba(12,174,134,0.28)' },
    selesai:{ bg: isDark ? 'rgba(255,255,255,0.02)' : '#f8f9fe',              border: isDark ? 'rgba(255,255,255,0.05)' : t.border },
  }

  const glassPanel = {
    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : t.border}`,
    boxShadow: t.cardShadow,
  }

  return (
    <div style={{ minHeight:'100vh', background:t.bgMesh, fontFamily:"'Space Mono',monospace", color:t.text }}>

      {/* Camera */}
      {step === 'camera' && (
        <Camera
          label={`ABSEN ${selected?.mode.toUpperCase()} — ${selected?.emp.name}`}
          onCapture={handleCapture}
          onClose={() => { setStep('list'); setSelected(null) }}
        />
      )}

      {/* Confirm preview */}
      {step === 'preview' && selected && (
        <div style={{ position:'fixed', inset:0, background:t.bgOverlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20, backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
          <div style={{ width:'min(380px,92vw)', animation:'slide-up 0.25s ease' }}>
            <p style={{ color:t.accent, fontSize:11, letterSpacing:3, textAlign:'center', marginBottom:16 }}>
              KONFIRMASI ABSEN {selected.mode.toUpperCase()}
            </p>
            <img src={photo} alt="selfie" style={{ width:'100%', borderRadius:20, border:`2px solid ${t.accent}`, transform:'scaleX(-1)', display:'block', boxShadow:`0 0 40px ${t.accent}30` }} />
            <div style={{ ...glassPanel, borderRadius:16, padding:'16px', margin:'14px 0' }}>
              <p style={{ color:t.text, fontSize:15, fontWeight:700, margin:'0 0 4px' }}>{selected.emp.name}</p>
              <p style={{ color:t.textMuted, fontSize:11, margin:'0 0 8px' }}>{selected.emp.role}</p>
              <p style={{ color:t.accent, fontSize:13 }}>
                {selected.mode === 'masuk' ? '📍' : '🏠'} {selected.mode === 'masuk' ? 'Masuk' : 'Pulang'} — {timeNowStr()}
              </p>
              {selected.mode === 'masuk' && isLate(timeNowStr(), selected.emp.jam_masuk) && (
                <p style={{ color:t.warn, fontSize:11, marginTop:6 }}>⚠️ Terlambat dari jadwal {selected.emp.jam_masuk}</p>
              )}
              {selected.mode === 'pulang' && isEarly(timeNowStr(), selected.emp.jam_pulang) && (
                <p style={{ color:t.warn, fontSize:11, marginTop:6 }}>⚠️ Lebih awal dari jadwal {selected.emp.jam_pulang}</p>
              )}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep('camera')} className="btn-lift" style={{ flex:1, padding:13, ...glassPanel, color:t.textSub, borderRadius:13, cursor:'pointer', fontFamily:'inherit' }}>
                Ulangi
              </button>
              <button onClick={handleConfirm} disabled={saving} className="btn-lift" style={{ flex:2, padding:13, background:t.gradientAccent, color:t.accentText, border:'none', borderRadius:13, cursor:'pointer', fontFamily:'inherit', fontWeight:700, letterSpacing:1, opacity:saving?0.6:1, boxShadow:t.glowAccent }}>
                {saving ? 'MENYIMPAN...' : 'SIMPAN ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        background: t.headerBg,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : t.border}`,
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

      {/* List */}
      <div style={{ padding:20 }}>
        <p style={{ color:t.textMuted, fontSize:10, letterSpacing:2, marginBottom:16 }}>PILIH KARYAWAN</p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {displayList.map(emp => {
            const status = statusOf(emp)
            const rec = getRecord(emp.id)
            const cs = cardBg[status]
            const aColor = getAvatarColor(emp.name)
            return (
              <button
                key={emp.id}
                onClick={() => handleSelect(emp)}
                className={status !== 'selesai' ? 'card-lift' : ''}
                style={{
                  background: isDark ? cs.bg : (status === 'belum' ? '#ffffff' : cs.bg),
                  backdropFilter: isDark ? 'blur(10px)' : 'none',
                  WebkitBackdropFilter: isDark ? 'blur(10px)' : 'none',
                  border: `1px solid ${cs.border}`,
                  borderRadius: 18, padding: '16px 18px',
                  cursor: status === 'selesai' ? 'default' : 'pointer',
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
