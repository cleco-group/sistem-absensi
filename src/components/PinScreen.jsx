import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { DARK, LIGHT } from '../lib/themes'

export default function PinScreen({ employees, onLogin }) {
  const { isDark, toggleTheme } = useTheme()
  const t = isDark ? DARK : LIGHT

  const [pin, setPin]     = useState('')
  const [err, setErr]     = useState('')
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
    <div style={{
      minHeight: '100vh',
      background: t.bgMesh,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Space Mono',monospace", padding: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient orbs — dark mode only */}
      {isDark && <>
        <div style={{
          position: 'fixed', width: 560, height: 560, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(74,240,200,0.07) 0%, transparent 70%)',
          top: '-120px', left: '-120px', pointerEvents: 'none',
          animation: 'orb-drift 11s ease-in-out infinite',
        }} />
        <div style={{
          position: 'fixed', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,170,255,0.06) 0%, transparent 70%)',
          bottom: '-80px', right: '-80px', pointerEvents: 'none',
          animation: 'orb-drift 14s ease-in-out infinite reverse',
        }} />
      </>}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="btn-lift"
        style={{
          position: 'fixed', top: 20, right: 20,
          background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : t.border}`,
          borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
          fontSize: 16, lineHeight: 1,
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.35)' : t.cardShadow,
        }}
      >{isDark ? '☀️' : '🌙'}</button>

      <div style={{ width: 'min(340px,100%)', textAlign: 'center', position: 'relative', zIndex: 1 }}>

        {/* Logo block */}
        <div style={{ marginBottom: 42, animation: 'slide-up 0.5s ease forwards' }}>
          <div style={{ position: 'relative', display: 'inline-flex', margin: '0 auto 22px' }}>
            {/* Spinning gradient border ring */}
            <div style={{
              position: 'absolute', inset: -6, borderRadius: 30,
              border: '2px solid transparent',
              background: `linear-gradient(${isDark ? '#04040f' : '#f0f4fa'}, ${isDark ? '#04040f' : '#f0f4fa'}) padding-box,
                           conic-gradient(from 0deg, transparent 0%, ${t.accent} 40%, transparent 70%) border-box`,
              animation: 'ring-spin 4s linear infinite',
            }} />
            {/* Outer pulse ring */}
            <div style={{
              position: 'absolute', inset: -12, borderRadius: 34,
              border: `1px solid ${t.accent}22`,
              animation: 'glow-pulse 2.5s ease-in-out infinite',
            }} />
            {/* Logo box */}
            <div style={{
              width: 76, height: 76, borderRadius: 24,
              background: isDark
                ? 'linear-gradient(145deg, #0a2a40, #083a2e)'
                : 'linear-gradient(145deg, #dff5ef, #d0eef8)',
              border: `1.5px solid ${t.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 34, position: 'relative', zIndex: 1,
              animation: 'float 3.5s ease-in-out infinite',
              boxShadow: isDark
                ? `0 0 48px rgba(74,240,200,0.28), 0 12px 40px rgba(0,0,0,0.6)`
                : `0 8px 32px rgba(12,174,134,0.22), 0 4px 12px rgba(0,0,0,0.06)`,
            }}>⏱</div>
          </div>

          <h1 style={{
            fontSize: 28, letterSpacing: 7, fontFamily: "'Syne',sans-serif", fontWeight: 800,
            margin: '0 0 8px',
            background: t.gradientAccent,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>ABSENSI</h1>
          <p style={{ color: t.textDim, fontSize: 10, letterSpacing: 3, margin: 0 }}>
            SISTEM MANAJEMEN KEHADIRAN
          </p>
        </div>

        {/* PIN display */}
        <div style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}>
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${err ? t.danger : isDark ? 'rgba(255,255,255,0.08)' : t.border}`,
            borderRadius: 20, padding: '22px 24px', marginBottom: 20,
            boxShadow: err
              ? `0 0 0 3px ${t.dangerDim}, 0 8px 32px rgba(0,0,0,0.35)`
              : isDark ? '0 8px 32px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset' : t.cardShadow,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}>
            <div style={{ minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              {pin.length === 0
                ? <span style={{ color: t.textDim, fontSize: 11, letterSpacing: 3 }}>MASUKKAN PIN</span>
                : Array.from({ length: Math.max(6, pin.length) }).map((_, i) => (
                    <div key={i} style={{
                      width: 12, height: 12, borderRadius: '50%',
                      background: i < pin.length
                        ? t.gradientAccent
                        : isDark ? '#1e1e3a' : t.borderInput,
                      transition: 'all .2s cubic-bezier(.34,1.56,.64,1)',
                      transform: i < pin.length ? 'scale(1.35)' : 'scale(1)',
                      boxShadow: i < pin.length
                        ? `0 0 14px ${t.accent}90, 0 0 28px ${t.accent}30`
                        : 'none',
                    }} />
                  ))
              }
            </div>
          </div>
        </div>

        {err && (
          <p style={{ color: t.danger, fontSize: 11, marginBottom: 16, letterSpacing: 1, animation: 'slide-up .2s ease' }}>
            {err}
          </p>
        )}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {keys.map(k => {
            const isConfirm = k === '✓'
            const isDel = k === '⌫'
            return (
              <button
                key={k}
                className="btn-lift"
                onClick={() => {
                  setErr('')
                  if (isDel) setPin(p => p.slice(0, -1))
                  else if (isConfirm) submit()
                  else if (pin.length < 6) setPin(p => p + k)
                }}
                style={{
                  padding: '19px 8px',
                  background: isConfirm
                    ? t.gradientAccent
                    : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : isDel ? t.bgCardAlt : 'rgba(255,255,255,0.92)',
                  backdropFilter: isDark ? 'blur(12px)' : 'none',
                  WebkitBackdropFilter: isDark ? 'blur(12px)' : 'none',
                  color: isConfirm ? t.accentText : isDel ? t.textMuted : t.text,
                  border: `1px solid ${isConfirm ? 'transparent' : isDark ? 'rgba(255,255,255,0.08)' : t.border}`,
                  borderRadius: 15,
                  cursor: 'pointer',
                  fontSize: 20,
                  fontFamily: "'Space Mono',monospace",
                  fontWeight: isConfirm ? 700 : 400,
                  boxShadow: isConfirm
                    ? t.glowAccent
                    : isDark ? '0 4px 16px rgba(0,0,0,0.35)' : t.cardShadow,
                }}
              >{k}</button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
