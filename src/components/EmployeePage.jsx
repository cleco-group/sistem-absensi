import { useState } from 'react'
import Camera from './Camera'
import { todayStr, timeNowStr, isLate, isEarly, fmtDate, fmtDay } from '../lib/utils'
import { useAttendance } from '../hooks/useData'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'

export default function EmployeePage({ employee, allEmployees, onLogout }) {
  const today = todayStr()
  const { records, upsertAttendance } = useAttendance(today, today)
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

  const [step, setStep]     = useState('list')
  const [selected, setSelected] = useState(null)
  const [photo, setPhoto]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast]   = useState(null)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const getRecord = (empId) => records.find(r => r.employee_id === empId)

  const statusOf = (emp) => {
    const r = getRecord(emp.id)
    if (!r?.jam_masuk) return 'belum'
    if (r.jam_masuk && !r.jam_pulang) return 'hadir'
    return 'selesai'
  }

  const handleSelect = (emp) => {
    const s = statusOf(emp)
    if (s === 'selesai') { showToast(`${emp.name} sudah absen pulang hari ini.`, false); return }
    setSelected({ emp, mode: s === 'hadir' ? 'pulang' : 'masuk' })
    setStep('camera')
  }

  const handleCapture = (img) => { setPhoto(img); setStep('preview') }

  const handleConfirm = async () => {
    setSaving(true)
    const { emp, mode } = selected
    const time = timeNowStr()
    const existing = getRecord(emp.id) || {}

    const payload = {
      employee_id: emp.id,
      tanggal: today,
      ...(mode === 'masuk' ? {
        jam_masuk: time,
        foto_masuk: photo,
        status_masuk: isLate(time, emp.jam_masuk) ? 'telat' : 'tepat',
        menit_telat: Math.max(0, parseInt(time.replace(':','')) - parseInt(emp.jam_masuk.replace(':','')))
      } : {
        jam_pulang: time,
        foto_pulang: photo,
        status_pulang: isEarly(time, emp.jam_pulang) ? 'lebih_awal' : 'tepat',
        jam_masuk: existing.jam_masuk,
        foto_masuk: existing.foto_masuk,
        status_masuk: existing.status_masuk,
        menit_telat: existing.menit_telat
      })
    }

    try {
      await upsertAttendance(payload)
      const telat = mode === 'masuk' && isLate(time, emp.jam_masuk)
      showToast(`✓ Absen ${mode} ${emp.name} — ${time}${telat ? ' (terlambat)' : ''}`)
    } catch {
      showToast('Gagal menyimpan. Cek koneksi.', false)
    }
    setSaving(false)
    setStep('list')
    setPhoto(null)
    setSelected(null)
  }

  const displayList = employee ? [employee] : allEmployees

  const cardStyle = {
    belum:  { bg: t.bgCard,  border: t.border },
    hadir:  { bg: isDark ? '#091e16' : '#f0fdf8', border: isDark ? '#1a5a3e' : '#a0dfc0' },
    selesai:{ bg: isDark ? '#09091e' : '#f8f9fe', border: isDark ? '#1a1a38' : '#d0d8ec' },
  }

  return (
    <div style={{ minHeight:'100vh', background:t.bg, fontFamily:"'Space Mono',monospace", color:t.text }}>
      {step === 'camera' && (
        <Camera
          label={`ABSEN ${selected?.mode.toUpperCase()} — ${selected?.emp.name}`}
          onCapture={handleCapture}
          onClose={() => { setStep('list'); setSelected(null) }}
        />
      )}

      {step === 'preview' && selected && (
        <div style={{ position:'fixed', inset:0, background:t.bgOverlay, display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
          <div style={{ width:'min(380px,92vw)' }}>
            <p style={{ color:t.accent, fontSize:11, letterSpacing:3, textAlign:'center', marginBottom:14 }}>
              KONFIRMASI ABSEN {selected.mode.toUpperCase()}
            </p>
            <img src={photo} alt="selfie" style={{ width:'100%', borderRadius:16, border:`2px solid ${t.accent}`, transform:'scaleX(-1)', display:'block', boxShadow:`0 0 24px ${t.accentDim}` }} />
            <div style={{ background:t.bgCard, borderRadius:13, padding:'14px 16px', margin:'12px 0', border:`1px solid ${t.border}`, boxShadow:t.shadow }}>
              <p style={{ color:t.text, fontSize:15, fontWeight:700, margin:'0 0 4px' }}>{selected.emp.name}</p>
              <p style={{ color:t.textMuted, fontSize:11, margin:'0 0 6px' }}>{selected.emp.role}</p>
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
              <button onClick={() => setStep('camera')} style={{ flex:1, padding:12, background:t.bgCard, border:`1px solid ${t.borderSub}`, color:t.textSub, borderRadius:11, cursor:'pointer', fontFamily:'inherit', boxShadow:t.shadow }}>Ulangi</button>
              <button onClick={handleConfirm} disabled={saving} style={{ flex:2, padding:12, background:t.accent, color:t.accentText, border:'none', borderRadius:11, cursor:'pointer', fontFamily:'inherit', fontWeight:700, letterSpacing:1, opacity:saving?0.6:1 }}>
                {saving ? 'MENYIMPAN...' : 'SIMPAN ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:t.bgCard, borderBottom:`1px solid ${t.border}`, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:t.shadow, position:'sticky', top:0, zIndex:100 }}>
        <div>
          <p style={{ color:t.accent, fontSize:14, letterSpacing:3, fontFamily:"'Syne',sans-serif", fontWeight:700, margin:0 }}>ABSENSI</p>
          <p style={{ color:t.textDim, fontSize:10, marginTop:2 }}>{fmtDay(today)}, {fmtDate(today)}</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            style={{ background:t.bgCardAlt, border:`1px solid ${t.border}`, borderRadius:9, padding:'6px 10px', cursor:'pointer', fontSize:15, lineHeight:1 }}
          >{isDark ? '☀️' : '🌙'}</button>
          <button onClick={onLogout} style={{ background:'transparent', border:`1px solid ${t.borderSub}`, color:t.textMuted, borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>KELUAR</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ margin:'12px 20px 0', background:toast.ok ? t.accentDim : t.dangerDim, border:`1px solid ${toast.ok ? t.accent : t.danger}`, borderRadius:10, padding:'10px 14px', color:toast.ok ? t.accent : t.danger, fontSize:12, textAlign:'center' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding:20 }}>
        <p style={{ color:t.textMuted, fontSize:10, letterSpacing:2, marginBottom:14 }}>PILIH KARYAWAN</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {displayList.map(emp => {
            const status = statusOf(emp)
            const rec = getRecord(emp.id)
            const cs = cardStyle[status]
            return (
              <button
                key={emp.id}
                onClick={() => handleSelect(emp)}
                style={{
                  background: cs.bg,
                  border:`1px solid ${cs.border}`,
                  borderRadius:14,
                  padding:'15px 16px',
                  cursor: status === 'selesai' ? 'default' : 'pointer',
                  textAlign:'left',
                  opacity: status === 'selesai' ? 0.6 : 1,
                  transition:'all .2s',
                  boxShadow: t.shadow,
                }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <p style={{ color:t.text, fontSize:14, fontWeight:700, margin:'0 0 3px' }}>{emp.name}</p>
                    <p style={{ color:t.textMuted, fontSize:11, margin:'0 0 6px' }}>{emp.role} · {emp.jam_masuk}–{emp.jam_pulang}</p>
                    {rec?.jam_masuk && (
                      <p style={{ color:t.accent, fontSize:11, margin:0 }}>
                        ✓ Masuk {rec.jam_masuk}
                        {rec.status_masuk === 'telat' && <span style={{ color:t.warn }}> (terlambat)</span>}
                        {rec?.jam_pulang && ` · Pulang ${rec.jam_pulang}`}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize:20, marginLeft:8 }}>
                    {status === 'selesai' ? '✅' : status === 'hadir' ? '🟡' : '⬜'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
