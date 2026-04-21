import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { useAttendance, useEmployees } from '../hooks/useData'
import { todayStr, weekRange, monthRange, fmtDate, fmtDay, fmtRupiah, hitungGaji, workdaysInRange } from '../lib/utils'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ─── sub-components ──────────────────────────────────────────────────────────
const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding:'11px 0', flex:1, background:'transparent', border:'none',
    color: active ? '#4af0c8' : '#444', cursor:'pointer',
    fontFamily:"'Space Mono',monospace", fontSize:11, letterSpacing:1,
    borderBottom: active ? '2px solid #4af0c8' : '2px solid transparent',
    transition:'all .15s'
  }}>{label}</button>
)

const Card = ({ icon, label, value, sub, color='#4af0c8' }) => (
  <div style={{ background:'#070718', border:'1px solid #0e0e2a', borderRadius:14, padding:'14px 16px' }}>
    <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
    <div style={{ color, fontSize:22, fontWeight:700, fontFamily:"'Syne',sans-serif" }}>{value}</div>
    <div style={{ color:'#aaa', fontSize:11, marginTop:2 }}>{label}</div>
    {sub && <div style={{ color:'#555', fontSize:10, marginTop:3 }}>{sub}</div>}
  </div>
)

const SectionTitle = ({ children }) => (
  <p style={{ color:'#4af0c8', fontSize:10, letterSpacing:3, margin:'22px 0 12px', fontWeight:700 }}>{children}</p>
)

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0d0d22', border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 12px', fontFamily:"'Space Mono',monospace", fontSize:11 }}>
      <p style={{ color:'#888', marginBottom:4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color:p.color, margin:'2px 0' }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function OwnerDashboard({ employees, onLogout, onRefreshEmployees }) {
  const today = todayStr()
  const [tab, setTab] = useState('dashboard')
  const [filterMode, setFilterMode] = useState('harian')
  const [customStart, setCustomStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(today)
  const [viewPhoto, setViewPhoto] = useState(null)
  const [salaryMonth, setSalaryMonth] = useState(today.slice(0, 7))

  const dateRange = useMemo(() => {
    if (filterMode === 'harian') return { start: today, end: today }
    if (filterMode === 'mingguan') return weekRange()
    if (filterMode === 'bulanan') return monthRange()
    return { start: customStart, end: customEnd }
  }, [filterMode, customStart, customEnd, today])

  const { records, loading } = useAttendance(dateRange.start, dateRange.end)

  const salaryRange = useMemo(() => {
    const d = new Date(salaryMonth + '-01')
    return { start: format(startOfMonth(d), 'yyyy-MM-dd'), end: format(endOfMonth(d), 'yyyy-MM-dd') }
  }, [salaryMonth])
  const { records: salaryRecords } = useAttendance(salaryRange.start, salaryRange.end)

  const empMap = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e])), [employees])

  const todayRecords = records.filter(r => r.tanggal === today)
  const hadirHariIni = todayRecords.filter(r => r.jam_masuk).length
  const telatHariIni = todayRecords.filter(r => r.status_masuk === 'telat').length

  const dailyChart = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(dateRange.start + 'T00:00:00'), end: new Date(dateRange.end + 'T00:00:00') })
    return days.map(d => {
      const ds = format(d, 'yyyy-MM-dd')
      const dayRecs = records.filter(r => r.tanggal === ds)
      return {
        hari: format(d, filterMode === 'harian' ? 'HH:mm' : 'dd/MM', { locale: localeId }),
        Hadir: dayRecs.filter(r => r.jam_masuk).length,
        Telat: dayRecs.filter(r => r.status_masuk === 'telat').length,
        Absen: employees.length - dayRecs.filter(r => r.jam_masuk).length,
      }
    })
  }, [records, dateRange, filterMode, employees])

  const empChart = useMemo(() => employees.map(emp => {
    const recs = records.filter(r => r.employee_id === emp.id)
    return {
      name: emp.name.split(' ')[0],
      Hadir: recs.filter(r => r.jam_masuk).length,
      Absen: workdaysInRange(dateRange.start, dateRange.end) - recs.filter(r => r.jam_masuk).length,
      Telat: recs.filter(r => r.status_masuk === 'telat').length,
    }
  }), [records, employees, dateRange])

  const pieData = [
    { name:'Hadir', value: hadirHariIni, color:'#4af0c8' },
    { name:'Tidak Hadir', value: employees.length - hadirHariIni, color:'#1e3a5f' },
  ]

  const salaryData = useMemo(() => employees.map(emp => {
    const recs = salaryRecords.filter(r => r.employee_id === emp.id)
    return { ...emp, ...hitungGaji(emp, recs, salaryRange.start, salaryRange.end) }
  }), [employees, salaryRecords, salaryRange])

  return (
    <div style={{ minHeight:'100vh', background:'#04040f', fontFamily:"'Space Mono',monospace", color:'#e0e0f0' }}>
      {viewPhoto && (
        <div onClick={() => setViewPhoto(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.97)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, cursor:'pointer' }}>
          <div style={{ textAlign:'center' }}>
            <img src={viewPhoto} style={{ maxWidth:'min(420px,90vw)', borderRadius:14, border:'2px solid #4af0c8', transform:'scaleX(-1)', display:'block' }} alt="Preview" />
            <p style={{ color:'#555', fontSize:11, marginTop:10 }}>Tap untuk menutup</p>
          </div>
        </div>
      )}

      <div style={{ background:'#070718', borderBottom:'1px solid #0e0e28', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <p style={{ color:'#4af0c8', fontSize:14, letterSpacing:3, fontFamily:"'Syne',sans-serif", fontWeight:800, margin:0 }}>OWNER PANEL</p>
          <p style={{ color:'#333', fontSize:9, marginTop:2, letterSpacing:1 }}>{fmtDay(today)}, {fmtDate(today)}</p>
        </div>
        <button onClick={onLogout} style={{ background:'transparent', border:'1px solid #1a1a3a', color:'#444', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>KELUAR</button>
      </div>

      <div style={{ display:'flex', borderBottom:'1px solid #0e0e28', background:'#070718' }}>
        <Tab label="📊 DASHBOARD" active={tab==='dashboard'} onClick={() => setTab('dashboard')} />
        <Tab label="💰 GAJI"      active={tab==='gaji'}      onClick={() => setTab('gaji')} />
        <Tab label="📋 ABSENSI"   active={tab==='absensi'}   onClick={() => setTab('absensi')} />
        <Tab label="⚙️ SETTING"   active={tab==='setting'}   onClick={() => setTab('setting')} />
      </div>

      <div style={{ padding:20 }}>
        {(tab === 'dashboard' || tab === 'absensi') && (
          <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:12, padding:'12px 14px', marginBottom:20 }}>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: filterMode === 'kustom' ? 10 : 0 }}>
              {['harian','mingguan','bulanan','kustom'].map(m => (
                <button key={m} onClick={() => setFilterMode(m)} style={{
                  padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontSize:10, letterSpacing:1,
                  background: filterMode===m ? '#4af0c8' : 'transparent',
                  color: filterMode===m ? '#021a14' : '#555',
                  border: `1px solid ${filterMode===m ? '#4af0c8' : '#1a1a3a'}`,
                  textTransform:'uppercase'
                }}>{m}</button>
              ))}
            </div>
            {filterMode === 'kustom' && (
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:4 }}>
                <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)}
                  style={{ background:'#0a0a1e', border:'1px solid #2a2a4a', borderRadius:8, padding:'6px 10px', color:'#4af0c8', fontFamily:'inherit', fontSize:11 }} />
                <span style={{ color:'#444' }}>—</span>
                <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)}
                  style={{ background:'#0a0a1e', border:'1px solid #2a2a4a', borderRadius:8, padding:'6px 10px', color:'#4af0c8', fontFamily:'inherit', fontSize:11 }} />
              </div>
            )}
            {filterMode !== 'kustom' && (
              <p style={{ color:'#333', fontSize:10, marginTop:filterMode==='kustom'?0:8 }}>
                {dateRange.start === dateRange.end ? fmtDate(dateRange.start) : `${fmtDate(dateRange.start)} – ${fmtDate(dateRange.end)}`}
              </p>
            )}
          </div>
        )}

        {tab === 'dashboard' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:4 }}>
              <Card icon="👥" label="Total Karyawan" value={employees.length} />
              <Card icon="✅" label="Hadir Hari Ini" value={hadirHariIni} color='#4af0c8' />
              <Card icon="❌" label="Tidak Hadir" value={employees.length - hadirHariIni} color='#ff6b6b' />
              <Card icon="⏰" label="Terlambat Hari Ini" value={telatHariIni} color='#ffaa44' />
            </div>

            <SectionTitle>KEHADIRAN HARI INI</SectionTitle>
            <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:14, padding:'16px 0 8px' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ color:'#888', fontSize:11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <SectionTitle>TREN KEHADIRAN</SectionTitle>
            <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:14, padding:'16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChart} barGap={2}>
                  <XAxis dataKey="hari" tick={{ fill:'#444', fontSize:10, fontFamily:"'Space Mono'" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#444', fontSize:10 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Hadir" fill="#4af0c8" radius={[4,4,0,0]} />
                  <Bar dataKey="Telat"  fill="#ffaa44" radius={[4,4,0,0]} />
                  <Bar dataKey="Absen"  fill="#2a1a1a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <SectionTitle>RINGKASAN PER KARYAWAN</SectionTitle>
            <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:14, padding:'16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={empChart} layout="vertical">
                  <XAxis type="number" tick={{ fill:'#444', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill:'#888', fontSize:10, fontFamily:"'Space Mono'" }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Hadir" fill="#4af0c8" radius={[0,4,4,0]} />
                  <Bar dataKey="Absen" fill="#ff6b6b" radius={[0,4,4,0]} />
                  <Bar dataKey="Telat" fill="#ffaa44" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'gaji' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div>
                <label style={{ color:'#555', fontSize:10, letterSpacing:1, display:'block', marginBottom:4 }}>PERIODE GAJI</label>
                <input type="month" value={salaryMonth} onChange={e=>setSalaryMonth(e.target.value)}
                  style={{ background:'#070718', border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 12px', color:'#4af0c8', fontFamily:'inherit', fontSize:12 }} />
              </div>
              <div style={{ marginTop:18 }}>
                <p style={{ color:'#555', fontSize:10 }}>{fmtDate(salaryRange.start)} – {fmtDate(salaryRange.end)}</p>
                <p style={{ color:'#333', fontSize:10 }}>Hari kerja: {workdaysInRange(salaryRange.start, salaryRange.end)} hari</p>
              </div>
            </div>

            <SectionTitle>GRAFIK GAJI BERSIH</SectionTitle>
            <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:14, padding:'16px 8px 8px', marginBottom:20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salaryData.map(e => ({ name: e.name.split(' ')[0], 'Gaji Bersih': e.gajiBersih, 'Potongan': e.potonganAbsen + e.potonganTelat, 'Bonus': e.bonusRajin }))}>
                  <XAxis dataKey="name" tick={{ fill:'#666', fontSize:10, fontFamily:"'Space Mono'" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => 'Rp'+Math.round(v/1000)+'k'} tick={{ fill:'#444', fontSize:9 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip formatter={(v) => fmtRupiah(v)} content={({ active, payload, label }) => active && payload?.length ? (
                    <div style={{ background:'#0d0d22', border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 12px', fontFamily:"'Space Mono',monospace", fontSize:10 }}>
                      <p style={{ color:'#888', marginBottom:4 }}>{label}</p>
                      {payload.map(p => <p key={p.name} style={{ color:p.color, margin:'2px 0' }}>{p.name}: {fmtRupiah(p.value)}</p>)}
                    </div>
                  ) : null} />
                  <Bar dataKey="Gaji Bersih" fill="#4af0c8" radius={[4,4,0,0]} />
                  <Bar dataKey="Potongan"    fill="#ff6b6b" radius={[4,4,0,0]} />
                  <Bar dataKey="Bonus"       fill="#ffaa44" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <SectionTitle>DETAIL GAJI KARYAWAN</SectionTitle>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {salaryData.map(emp => (
                <div key={emp.id} style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:14, overflow:'hidden' }}>
                  <div style={{ background:'#0a0a1e', padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #0e0e28' }}>
                    <div>
                      <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:'0 0 2px' }}>{emp.name}</p>
                      <p style={{ color:'#555', fontSize:10, margin:0 }}>{emp.role} · {emp.tipe_gaji === 'harian' ? '📅 Harian' : '📆 Bulanan'}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ color:'#4af0c8', fontSize:18, fontWeight:700, margin:'0 0 2px', fontFamily:"'Syne',sans-serif" }}>{fmtRupiah(emp.gajiBersih)}</p>
                      <p style={{ color:'#333', fontSize:10, margin:0 }}>Gaji Bersih</p>
                    </div>
                  </div>
                  <div style={{ padding:'10px 16px' }}>
                    {[
                      ['Gaji Pokok', emp.tipe_gaji==='harian' ? `${emp.hariHadir} hari × ${fmtRupiah(emp.gaji_pokok)}` : fmtRupiah(emp.gajiKotor), '#aaa'],
                      ['Potongan Absen', `${emp.hariAbsen} hari × ${fmtRupiah(emp.potongan_absen)}`, '#ff6b6b'],
                      ['Potongan Telat', `${emp.jumlahTelat}× × ${fmtRupiah(emp.potongan_telat)}`, '#ffaa44'],
                      ['Bonus Tepat Waktu', `${emp.jumlahRajin}× × ${fmtRupiah(emp.bonus_rajin)}`, '#4af0c8'],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid #0a0a18' }}>
                        <span style={{ color:'#555', fontSize:11 }}>{label}</span>
                        <span style={{ color, fontSize:11 }}>{val}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0 2px', marginTop:4 }}>
                      <span style={{ color:'#888', fontSize:12, fontWeight:700 }}>TOTAL BERSIH</span>
                      <span style={{ color:'#4af0c8', fontSize:14, fontWeight:700 }}>{fmtRupiah(emp.gajiBersih)}</span>
                    </div>
                    <div style={{ display:'flex', gap:16, marginTop:8, paddingTop:8, borderTop:'1px solid #0a0a18' }}>
                      {[['Hadir',emp.hariHadir,'#4af0c8'],['Absen',emp.hariAbsen,'#ff6b6b'],['Telat',emp.jumlahTelat,'#ffaa44']].map(([l,v,c]) => (
                        <div key={l} style={{ textAlign:'center' }}>
                          <div style={{ color:c, fontSize:16, fontWeight:700 }}>{v}</div>
                          <div style={{ color:'#444', fontSize:9 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'absensi' && (
          <>
            <SectionTitle>TABEL ABSENSI</SectionTitle>
            {loading ? (
              <div style={{ textAlign:'center', color:'#333', padding:40, fontSize:12 }}>Memuat data...</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {employees.map(emp => {
                  const empRecs = records.filter(r => r.employee_id === emp.id)
                  return (
                    <div key={emp.id} style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:14, overflow:'hidden' }}>
                      <div style={{ background:'#0a0a1e', padding:'10px 14px', borderBottom:'1px solid #0e0e28' }}>
                        <p style={{ color:'#fff', fontSize:12, fontWeight:700, margin:'0 0 2px' }}>{emp.name}</p>
                        <p style={{ color:'#444', fontSize:10, margin:0 }}>{emp.role}</p>
                      </div>
                      {empRecs.length === 0 ? (
                        <p style={{ color:'#333', fontSize:11, padding:'12px 14px', margin:0 }}>Tidak ada data dalam periode ini.</p>
                      ) : (
                        <div style={{ overflowX:'auto' }}>
                          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                            <thead>
                              <tr>
                                {['Hari','Tanggal','Masuk','Status','Pulang','Foto'].map(h => (
                                  <th key={h} style={{ padding:'8px 10px', color:'#333', fontWeight:400, textAlign:'left', borderBottom:'1px solid #0a0a18', whiteSpace:'nowrap' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {empRecs.sort((a,b) => a.tanggal.localeCompare(b.tanggal)).map((r,i) => (
                                <tr key={r.id} style={{ background: i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                                  <td style={{ padding:'8px 10px', color:'#666', whiteSpace:'nowrap' }}>{fmtDay(r.tanggal)}</td>
                                  <td style={{ padding:'8px 10px', color:'#888', whiteSpace:'nowrap' }}>{fmtDate(r.tanggal)}</td>
                                  <td style={{ padding:'8px 10px', color: r.jam_masuk ? '#4af0c8' : '#333' }}>{r.jam_masuk || '—'}</td>
                                  <td style={{ padding:'8px 10px', whiteSpace:'nowrap' }}>
                                    {r.jam_masuk
                                      ? <span style={{ color: r.status_masuk==='telat'?'#ffaa44':'#4af0c8', fontSize:10 }}>{r.status_masuk==='telat'?`⚠️ Telat`:`✓ Tepat`}</span>
                                      : <span style={{ color:'#ff5555', fontSize:10 }}>❌ Absen</span>
                                    }
                                  </td>
                                  <td style={{ padding:'8px 10px', color: r.jam_pulang ? '#4af0c8' : '#333' }}>{r.jam_pulang || '—'}</td>
                                  <td style={{ padding:'8px 10px' }}>
                                    <div style={{ display:'flex', gap:4 }}>
                                      {r.foto_masuk && <button onClick={() => setViewPhoto(r.foto_masuk)} style={{ background:'#0a2a1a', border:'1px solid #2a5a3a', color:'#4af0c8', borderRadius:5, padding:'2px 7px', cursor:'pointer', fontFamily:'inherit', fontSize:9 }}>M</button>}
                                      {r.foto_pulang && <button onClick={() => setViewPhoto(r.foto_pulang)} style={{ background:'#0a1a2a', border:'1px solid #2a3a5a', color:'#6af', borderRadius:5, padding:'2px 7px', cursor:'pointer', fontFamily:'inherit', fontSize:9 }}>P</button>}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'setting' && (
          <SettingTab employees={employees} onRefresh={onRefreshEmployees} />
        )}
      </div>
    </div>
  )
}

// ─── Setting Tab ─────────────────────────────────────────────────────────────
function SettingTab({ employees, onRefresh }) {
  const { upsertEmployee, deleteEmployee } = useEmployees()
  const [editId, setEditId]   = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm]       = useState({})
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState('')

  const blankForm = { emp_code:'', name:'', role:'', pin:'0000', jam_masuk:'08:00', jam_pulang:'17:00', tipe_gaji:'bulanan', gaji_pokok:0, potongan_absen:0, potongan_telat:0, bonus_rajin:0 }

  const startEdit = (emp) => { setForm({ ...emp }); setEditId(emp.id); setShowNew(false); setErr('') }
  const startNew  = () => { setForm({ ...blankForm }); setShowNew(true); setEditId(null); setErr('') }
  const cancel    = () => { setEditId(null); setShowNew(false); setErr('') }

  const save = async () => {
    if (!form.name || !form.emp_code) { setErr('Nama dan kode karyawan wajib diisi.'); return }
    setSaving(true); setErr('')
    try {
      await upsertEmployee(form)
      cancel(); onRefresh()
    } catch(e) { setErr(e.message) }
    setSaving(false)
  }

  const del = async (id, name) => {
    if (!confirm(`Hapus karyawan "${name}"? Data absensi tidak terhapus.`)) return
    try { await deleteEmployee(id); onRefresh() }
    catch(e) { alert(e.message) }
  }

  const renderField = ({ label, field, type='text', opts }) => (
    <div key={field} style={{ marginBottom:10 }}>
      <label style={{ color:'#555', fontSize:10, display:'block', marginBottom:4, letterSpacing:1 }}>{label}</label>
      {opts ? (
        <select value={form[field]||''} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
          style={{ width:'100%', background:'#0a0a1e', border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 10px', color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:12 }}>
          {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={type} value={form[field]||''} onChange={e=>setForm(f=>({...f,[field]:type==='number'?Number(e.target.value):e.target.value}))}
          style={{ width:'100%', background:'#0a0a1e', border:'1px solid #2a2a4a', borderRadius:8, padding:'8px 10px', color:'#fff', fontFamily:"'Space Mono',monospace", fontSize:12, boxSizing:'border-box' }} />
      )}
    </div>
  )

  const renderEmpForm = () => (
    <div style={{ background:'#070718', border:'1px solid #4af0c8', borderRadius:14, padding:16, marginBottom:16 }}>
      <p style={{ color:'#4af0c8', fontSize:10, letterSpacing:2, marginBottom:14 }}>{showNew ? 'KARYAWAN BARU' : 'EDIT KARYAWAN'}</p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <div style={{ gridColumn:'1/-1' }}>{renderField({ label:"NAMA LENGKAP", field:"name" })}</div>
        {renderField({ label:"KODE (cth: E004)", field:"emp_code" })}
        {renderField({ label:"JABATAN", field:"role" })}
        {renderField({ label:"JAM MASUK", field:"jam_masuk", type:"time" })}
        {renderField({ label:"JAM PULANG", field:"jam_pulang", type:"time" })}
        {renderField({ label:"PIN LOGIN", field:"pin" })}
        {renderField({ label:"TIPE GAJI", field:"tipe_gaji", opts:[{v:'bulanan',l:'Bulanan'},{v:'harian',l:'Harian per hari hadir'}] })}
        <div style={{ gridColumn:'1/-1' }}>
          {renderField({ label:form.tipe_gaji==='harian'?'GAJI PER HARI (Rp)':'GAJI POKOK BULANAN (Rp)', field:"gaji_pokok", type:"number" })}
        </div>
        {renderField({ label:"POTONGAN PER HARI ABSEN (Rp)", field:"potongan_absen", type:"number" })}
        {renderField({ label:"POTONGAN PER KETERLAMBATAN (Rp)", field:"potongan_telat", type:"number" })}
        <div style={{ gridColumn:'1/-1' }}>{renderField({ label:"BONUS PER HARI TEPAT WAKTU (Rp)", field:"bonus_rajin", type:"number" })}</div>
      </div>
      {err && <p style={{ color:'#ff5555', fontSize:11, marginBottom:10 }}>{err}</p>}
      <div style={{ display:'flex', gap:10, marginTop:4 }}>
        <button onClick={cancel} style={{ flex:1, padding:10, background:'transparent', border:'1px solid #2a2a4a', color:'#666', borderRadius:9, cursor:'pointer', fontFamily:'inherit', fontSize:11 }}>Batal</button>
        <button onClick={save} disabled={saving} style={{ flex:2, padding:10, background:'#4af0c8', color:'#021a14', border:'none', borderRadius:9, cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:11, opacity:saving?0.6:1 }}>
          {saving ? 'MENYIMPAN...' : 'SIMPAN'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <p style={{ color:'#4af0c8', fontSize:10, letterSpacing:2, margin:0 }}>DATA KARYAWAN ({employees.length})</p>
        {!showNew && !editId && (
          <button onClick={startNew} style={{ background:'#4af0c8', color:'#021a14', border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:1 }}>+ TAMBAH</button>
        )}
      </div>

      {showNew && renderEmpForm()}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {employees.map(emp => (
          <div key={emp.id}>
            {editId === emp.id ? renderEmpForm() : (
              <div style={{ background:'#070718', border:'1px solid #0e0e28', borderRadius:13, padding:'13px 15px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <p style={{ color:'#fff', fontSize:13, fontWeight:700, margin:'0 0 3px' }}>{emp.name}</p>
                    <p style={{ color:'#555', fontSize:10, margin:'0 0 6px' }}>{emp.role} · {emp.emp_code}</p>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      <span style={{ color:'#4af0c8', fontSize:10 }}>⏰ {emp.jam_masuk}–{emp.jam_pulang}</span>
                      <span style={{ color:'#888', fontSize:10 }}>🔑 {emp.pin}</span>
                      <span style={{ color:'#ffaa44', fontSize:10 }}>{emp.tipe_gaji === 'harian' ? `💵 ${fmtRupiah(emp.gaji_pokok)}/hari` : `💵 ${fmtRupiah(emp.gaji_pokok)}/bln`}</span>
                    </div>
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:4 }}>
                      {emp.potongan_absen > 0 && <span style={{ color:'#ff6b6b', fontSize:9 }}>✂️ Absen: {fmtRupiah(emp.potongan_absen)}</span>}
                      {emp.potongan_telat > 0 && <span style={{ color:'#ffaa44', fontSize:9 }}>✂️ Telat: {fmtRupiah(emp.potongan_telat)}</span>}
                      {emp.bonus_rajin > 0 && <span style={{ color:'#4af0c8', fontSize:9 }}>⭐ Bonus: {fmtRupiah(emp.bonus_rajin)}</span>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0, marginLeft:10 }}>
                    <button onClick={() => startEdit(emp)} style={{ background:'#0a1e2e', border:'1px solid #1e4a6e', color:'#4af', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>Edit</button>
                    <button onClick={() => del(emp.id, emp.name)} style={{ background:'#1e0a0a', border:'1px solid #4e1a1a', color:'#f55', borderRadius:8, padding:'6px 11px', cursor:'pointer', fontFamily:'inherit', fontSize:10 }}>Hapus</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
