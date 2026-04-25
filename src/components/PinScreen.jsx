import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'

export default function PinScreen({ employees, onLogin }) {
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

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
    <div style={{ minHeight:'100vh', background:t.bg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Space Mono',monospace", padding:20 }}>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        style={{
          position:'fixed', top:16, right:16,
          background:t.bgCard, border:`1px solid ${t.border}`,
          borderRadius:10, padding:'7px 12px', cursor:'pointer',
          fontSize:16, lineHeight:1, boxShadow:t.shadow,
          transition:'all 0.2s',
        }}
      >{isDark ? '☀️' : '🌙'}</button>

      <div style={{ width:'min(340px,100%)', textAlign:'center' }}>
        {/* Logo */}
        <div style={{ marginBottom:36 }}>
          <div style={{
            width:70, height:70, borderRadius:22,
            background: isDark
              ? 'linear-gradient(135deg,#0a2a4a,#0a4a3a)'
              : 'linear-gradient(135deg,#dff5ef,#d4eef8)',
            border:`2px solid ${t.accentBorder}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:30, margin:'0 auto 18px',
            boxShadow: isDark ? `0 0 32px ${t.accentDim}` : `0 6px 20px ${t.accentDim}`,
          }}>⏱</div>
          <h1 style={{ color:t.accent, fontSize:22, letterSpacing:5, fontFamily:"'Syne',sans-serif", fontWeight:800, margin:'0 0 6px' }}>ABSENSI</h1>
          <p style={{ color:t.textDim, fontSize:10, letterSpacing:2 }}>SISTEM MANAJEMEN KEHADIRAN</p>
        </div>

        {/* PIN Display */}
        <div style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
          <div style={{
            background: t.bgCard,
            border:`1px solid ${err ? t.danger : t.borderSub}`,
            borderRadius:16, padding:'18px 20px', marginBottom:20,
            boxShadow: err ? `0 0 0 3px ${t.dangerDim}` : t.shadow,
            transition:'border-color 0.2s, box-shadow 0.2s',
          }}>
            <div style={{ minHeight:38, display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
              {pin.length === 0
                ? <span style={{ color:t.textDim, fontSize:11, letterSpacing:2 }}>MASUKKAN PIN</span>
                : Array.from({ length: Math.max(6, pin.length) }).map((_, i) => (
                    <div key={i} style={{
                      width:11, height:11, borderRadius:'50%',
                      background: i < pin.length ? t.accent : t.borderInput,
                      transition:'all .15s',
                      transform: i < pin.length ? 'scale(1.25)' : 'scale(1)',
                      boxShadow: i < pin.length ? `0 0 6px ${t.accent}80` : 'none',
                    }} />
                  ))
              }
            </div>
          </div>
        </div>

        {err && <p style={{ color:t.danger, fontSize:11, marginBottom:16, letterSpacing:1 }}>{err}</p>}

        {/* Numpad */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:9 }}>
          {keys.map(k => {
            const isConfirm = k === '✓'
            const isDel = k === '⌫'
            return (
              <button
                key={k}
                onClick={() => {
                  setErr('')
                  if (isDel) setPin(p => p.slice(0, -1))
                  else if (isConfirm) submit()
                  else if (pin.length < 6) setPin(p => p + k)
                }}
                style={{
                  padding:'18px 8px',
                  background: isConfirm
                    ? t.accent
                    : isDel ? t.bgCardAlt : t.bgCard,
                  color: isConfirm ? t.accentText : isDel ? t.textMuted : t.text,
                  border:`1px solid ${isConfirm ? t.accentBorder : t.border}`,
                  borderRadius:13,
                  cursor:'pointer',
                  fontSize:18,
                  fontFamily:"'Space Mono',monospace",
                  fontWeight: isConfirm ? 700 : 400,
                  transition:'all .15s',
                  boxShadow: isConfirm ? (isDark ? `0 0 16px ${t.accentDim}` : `0 3px 10px ${t.accentDim}`) : t.shadow,
                }}
                onMouseEnter={e => {
                  if (!isConfirm) e.currentTarget.style.background = t.bgHover
                  e.currentTarget.style.borderColor = isConfirm ? t.accent : t.borderInput
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isConfirm ? t.accent : isDel ? t.bgCardAlt : t.bgCard
                  e.currentTarget.style.borderColor = isConfirm ? t.accentBorder : t.border
                }}
              >{k}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
