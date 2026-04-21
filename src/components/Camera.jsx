import { useRef, useEffect, useState } from 'react'

const S = {
  overlay: { position:'fixed', inset:0, background:'rgba(2,2,15,0.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:9999, padding:20 },
  wrap: { width:'min(400px,92vw)', display:'flex', flexDirection:'column', gap:14 },
  label: { color:'#4af0c8', fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:3, textAlign:'center' },
  videoBox: { position:'relative', borderRadius:16, overflow:'hidden', border:'2px solid #4af0c8', boxShadow:'0 0 48px rgba(74,240,200,0.2)' },
  scanline: { position:'absolute', inset:0, background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(74,240,200,0.04) 3px,rgba(74,240,200,0.04) 4px)', pointerEvents:'none' },
  corner: (t,l,r,b) => ({ position:'absolute', width:22, height:22, ...(t!=null?{top:t}:{}), ...(b!=null?{bottom:b}:{}), ...(l!=null?{left:l}:{}), ...(r!=null?{right:r}:{}), borderTop:t!=null?'2px solid #4af0c8':'none', borderBottom:b!=null?'2px solid #4af0c8':'none', borderLeft:l!=null?'2px solid #4af0c8':'none', borderRight:r!=null?'2px solid #4af0c8':'none' }),
  btn: (primary) => ({ flex:primary?2:1, padding:'13px 0', background:primary?'#4af0c8':'transparent', color:primary?'#021a14':'#888', border:primary?'none':'1px solid #2a2a4a', borderRadius:10, cursor:'pointer', fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:primary?700:400, letterSpacing:primary?2:0, transition:'all .15s' }),
}

export default function Camera({ label = 'AMBIL FOTO SELFIE', onCapture, onClose }) {
  const videoRef = useRef()
  const canvasRef = useRef()
  const [ready, setReady] = useState(false)
  const [err, setErr] = useState('')
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    let stream
    navigator.mediaDevices.getUserMedia({ video: { facingMode:'user', width:640, height:480 }, audio:false })
      .then(s => { stream = s; videoRef.current.srcObject = s; setReady(true) })
      .catch(() => setErr('Izinkan akses kamera di browser untuk melanjutkan.'))
    return () => stream?.getTracks().forEach(t => t.stop())
  }, [])

  const capture = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 200)
    const v = videoRef.current, c = canvasRef.current
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d').drawImage(v, 0, 0)
    onCapture(c.toDataURL('image/jpeg', 0.65))
  }

  return (
    <div style={S.overlay}>
      {flash && <div style={{ position:'fixed', inset:0, background:'rgba(255,255,255,0.15)', zIndex:10000, pointerEvents:'none' }} />}
      <div style={S.wrap}>
        <p style={S.label}>{label}</p>
        <div style={S.videoBox}>
          {err
            ? <div style={{ background:'#0d0d20', padding:40, textAlign:'center', color:'#ff6b6b', fontFamily:"'Space Mono',monospace", fontSize:12 }}>{err}</div>
            : <video ref={videoRef} autoPlay playsInline style={{ width:'100%', display:'block', transform:'scaleX(-1)' }} />
          }
          <canvas ref={canvasRef} style={{ display:'none' }} />
          <div style={S.scanline} />
          <div style={S.corner(8,8,null,null)} />
          <div style={S.corner(8,null,8,null)} />
          <div style={S.corner(null,8,null,8)} />
          <div style={S.corner(null,null,8,8)} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button style={S.btn(false)} onClick={onClose}>BATAL</button>
          <button style={{ ...S.btn(true), opacity:ready?1:0.4, cursor:ready?'pointer':'default' }} disabled={!ready} onClick={capture}>📸 FOTO</button>
        </div>
      </div>
    </div>
  )
}
