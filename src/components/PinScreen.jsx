import { useState } from 'react'

export default function PinScreen({ employees, onLogin }) {
  const [pin, setPin]   = useState('')
  const [err, setErr]   = useState('')
  const [shake, setShake] = useState(false)

  const OWNER_PIN = '0000'

  const doError = (msg) => {
    setErr(msg); setPin(''); setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const submit = () => {
    if (!pin) return
    if (pin === OWNER_PIN) { onLogin('owner', null); return }
    const emp = employees.find(e => e.pin === pin)
    if (emp) { onLogin('employee', emp); return }
    doError('PIN salah. Coba lagi.')
  }

  const keys = [1,2,3,4,5,6,7,8,9,'⌫',0,'✓']

  return (
    <div style={{ minHeight:'100vh', background:'#04040f', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace", padding:20 }}>
      <div style={{ width:'min(340px,100%)', textAlign:'center' }}>
        {/* Logo */}
        <div style={{ marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:20, background:'linear-gradient(135deg,#0a2a4a,#0a4a3a)', border:'1px solid #1e5a4a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 16px' }}>⏱</div>
          <h1 style={{ color:'#4af0c8', fontSize:20, letterSpacing:4, fontFamily:"'Syne',sans-serif", fontWeight:800, margin:'0 0 6px' }}>ABSENSI</h1>
          <p style={{ color:'#333', fontSize:10, letterSpacing:2 }}>SISTEM MANAJEMEN KEHADIRAN</p>
        </div>

        {/* PIN Display */}
        <div style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
          <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>
          <div style={{ background:'#070718', border:`1px solid ${err?'#ff4444':'#1a1a3a'}`, borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
            <div style={{ minHeight:36, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
              {pin.length === 0
                ? <span style={{ color:'#2a2a4a', fontSize:12, letterSpacing:2 }}>MASUKKAN PIN</span>
                : Array.from({ length: Math.max(6, pin.length) }).map((_, i) => (
                    <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i < pin.length ? '#4af0c8' : '#1a1a3a', transition:'all .15s', transform: i < pin.length ? 'scale(1.2)' : 'scale(1)' }} />
                  ))
              }
            </div>
          </div>
        </div>

        {err && <p style={{ color:'#ff6b6b', fontSize:11, marginBottom:16, letterSpacing:1 }}>{err}</p>}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          {keys.map(k => (
            <button key={k} onClick={() => {
              setErr('')
              if (k === '⌫') setPin(p => p.slice(0, -1))
              else if (k === '✓') submit()
              else if (pin.length < 6) setPin(p => p + k)
            }} style={{
              padding:'17px 8px',
              background: k === '✓' ? 'linear-gradient(135deg,#0a4a3a,#0a3a4a)' : k === '⌫' ? '#0d0d20' : '#0a0a1a',
              color: k === '✓' ? '#4af0c8' : k === '⌫' ? '#666' : '#ccc',
              border: `1px solid ${k === '✓' ? '#1e6a5a' : '#1a1a2e'}`,
              borderRadius:12,
              cursor:'pointer',
              fontSize: k === '✓' || k === '⌫' ? 18 : 18,
              fontFamily:"'Space Mono',monospace",
              fontWeight: k === '✓' ? 700 : 400,
              transition:'all .1s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#2a4a6a'}
            onMouseLeave={e => e.currentTarget.style.borderColor = k === '✓' ? '#1e6a5a' : '#1a1a2e'}
            >{k}</button>
          ))}
        </div>

        <p style={{ color:'#222', fontSize:10, marginTop:24, letterSpacing:1 }}>
          PIN OWNER: 0000 &nbsp;|&nbsp; KARYAWAN: PIN MASING-MASING
        </p>
      </div>
    </div>
  )
}
