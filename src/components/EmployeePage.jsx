import { useState } from 'react'
import Camera from './Camera'
import { todayStr, timeNowStr, isLate, isEarly, fmtDate, fmtDay } from '../lib/utils'
import { useAttendance } from '../hooks/useData'

export default function EmployeePage({ employee, allEmployees, onLogout }) {
  const today = todayStr()
  const { records, upsertAttendance } = useAttendance(today, today)

  const [step, setStep] = useState('list') // list | camera | preview
  const [selected, setSelected] = useState(null) // { emp, mode }
  const [photo, setPhoto] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

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
        // preserve masuk data
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
    } catch (e) {
      showToast('Gagal menyimpan. Cek koneksi.', false)
    }
    setSaving(false)
    setStep('list')
    setPhoto(null)
    setSelected(null)
  }

  // If this page is accessed via employee PIN, show only that employee
  const displayList = employee ? [employee] : allEmployees

  return (
    <div style={{ minHeight:'100vh', background:'#04040f', fontFamily:"'Space Mono',monospace", color:'#e0e0f0' }}>
      {step === 'camera' && (
        <Camera
          label={`ABSEN ${selected?.mode.toUpperCase()} — ${selected?.emp.name}`}
          onCapture={handleCapture}
          onClose={() => { setStep('list'); setSelected(null) }}
        />
      )}

      {step === 'preview' && selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(2,2,15,0.97)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 }}>
          <div style={{ width:'min(380px,92vw)' }}>
            <p style={{ color:'#4af0c8', fontSize:11, letterSpacing:3, textAlign:'center', marginBottom:14 }}>
              KONFIRMASI ABSEN {selected.mode.toUpperCase()}
            </p>
            <img src={photo} alt="selfie" style={{ width:'100%', borderRadius:14, border:'2px solid #4af0c8', transform:'scaleX(-1)', display:'block' }} />
            <div style={{ background:'#070718', borderRadius:12, padding:'14px 16px', margin:'12px 0', border:'1px solid #1a1a3a' }}>
              <p style={{ color:'#fff', fontSize:15, fontWeight:700, margin:'0 0 4px' }}>{selected.emp.name}</p>
              <p style={{ color:'#666', fontSize:11, margin:'0 0 4px' }}>{selected.emp.role}</p>
              <p style={{ color:'#4af0c8', fontSize:13 }}>{selected.mode === 'masuk' ? '📍' : '🏠'} {selected.mode === 'masuk' ? 'Masuk' : 'Pulang'} — {timeNowStr()}</p>
              {selected.mode === 'masuk' && isLate(timeNowStr(), selected.emp.jam_masuk) && (
                <p style={{ color:'#ffaa44', fontSize:11, marginTop:6 }}>⚠️ Terlambat dari jadwal {selected.emp.jam_masuk}</p>
              )}
              {selected.mode === 'pulang' && isEarly(timeNowStr(), selected.emp.jam_pulang) && (
                <p style={{ color:'#ffaa44', fontSize:11, marginTop:6 }}>⚠️ Lebih awal dari jadwal {selected.emp.jam_pulang}</p>
              )}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setStep('camera')} style={{ flex:1, padding:12, background:'transparent', border:'1px solid #2a2a4a', color:'#888', borderRadius:10, cursor:'pointer', fontFamily:'inherit' }}>Ulangi</button>
              <button onClick={handleConfirm} disabled={saving} style={{ flex:2, padding:12, background:'#4af0c8', color:'#021a14', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'inherit', fontWeight:700, letterSpacing:1, opacity:saving?0.6:1 }}>
                {saving ? 'MENYIMPAN...' : 'SIMPAN ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'#070718', borderBottom:'1px solid #0e0e28', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <p style={{ color:'#4af0c8', fontSize:13, letterSpacing:3, fontFamily:"'Syne',sans-serif", fontWeight:700 }}>ABSENSI</p>
          <p style={{ color:'#333', fontSize:10, marginTop:2 }}>{fmtDay(today)}, {fmtDate(today)}</p>
        </div>
        <button onClick={onLogout} style={{ background:'transparent', border:'1px solid #1a1a3a', color:'#444', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>KELUAR</button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ margin:'12px 20px 0', background:toast.ok?'rgba(74,240,200,0.1)':'rgba(255,80,80,0.1)', border:`1px solid ${toast.ok?'#4af0c8':'#ff5050'}`, borderRadius:10, padding:'10px 14px', color:toast.ok?'#4af0c8':'#ff8080', fontSize:12, textAlign:'center' }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding:20 }}>
        <p style={{ color:'#333', fontSize:10, letterSpacing:2, marginBottom:14 }}>PILIH KARYAWAN</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {displayList.map(emp => {
            const status = statusOf(emp)
            const rec = getRecord(emp.id)
            const colors = { belum:'#1a1a3a', hadir:'#0a3a2a', selesai:'#1a1a2a' }
            const border = { belum:'#2a2a4a', hadir:'#2a6a5a', selesai:'#2a2a3a' }
            return (
              <button key={emp.id} onClick={() => handleSelect(emp)} style={{
                background: colors[status],
                border: `1px solid ${border[status]}`,
                borderRadius:13,
                padding:'15px 16px',
                cursor: status === 'selesai' ? 'default' : 'pointer',
                textAlign:'left',
                opacity: status === 'selesai' ? 0.6 : 1,
                transition:'all .2s'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <p style={{ color:'#fff', fontSize:14, fontWeight:700, margin:'0 0 3px' }}>{emp.name}</p>
                    <p style={{ color:'#555', fontSize:11, margin:'0 0 6px' }}>{emp.role} · {emp.jam_masuk}–{emp.jam_pulang}</p>
                    {rec?.jam_masuk && (
                      <p style={{ color:'#4af0c8', fontSize:11, margin:0 }}>
                        ✓ Masuk {rec.jam_masuk}
                        {rec.status_masuk === 'telat' && <span style={{ color:'#ffaa44' }}> (terlambat)</span>}
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
