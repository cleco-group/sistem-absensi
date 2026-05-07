import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ─── Date helpers ────────────────────────────────────────────────────────────
export const todayStr    = () => format(new Date(), 'yyyy-MM-dd')
export const timeNowStr  = () => format(new Date(), 'HH:mm')
export const fmtDate     = (d) => format(new Date(d), 'dd MMM yyyy', { locale: localeId })
export const fmtDay      = (d) => format(new Date(d + 'T00:00:00'), 'EEEE', { locale: localeId })
export const fmtMonth    = (d) => format(new Date(d), 'MMMM yyyy', { locale: localeId })

export const weekRange = (date = new Date()) => ({
  start: format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  end:   format(endOfWeek(date, { weekStartsOn: 1 }),   'yyyy-MM-dd'),
})
export const monthRange = (date = new Date()) => ({
  start: format(startOfMonth(date), 'yyyy-MM-dd'),
  end:   format(endOfMonth(date),   'yyyy-MM-dd'),
})

// Hitung hari kerja (Senin-Sabtu) dalam rentang
export const workdaysInRange = (start, end) =>
  eachDayOfInterval({ start: new Date(start + 'T00:00:00'), end: new Date(end + 'T00:00:00') })
    .filter(d => d.getDay() !== 0).length  // exclude Minggu

// ─── Salary Calculation ───────────────────────────────────────────────────────
/**
 * Hitung gaji karyawan untuk suatu rentang tanggal
 * @param {object} emp  — row dari tabel employees
 * @param {array}  recs — rows dari tabel attendance dalam rentang
 * @param {string} start — 'yyyy-MM-dd'
 * @param {string} end   — 'yyyy-MM-dd'
 */
export function hitungGaji(emp, recs, start, end) {
  const hariKerja = workdaysInRange(start, end)
  const hariHadir = recs.filter(r => r.jam_masuk).length
  const hariAbsen = hariKerja - hariHadir
  const jumlahTelat = recs.filter(r => r.status_masuk === 'telat').length
  const jumlahRajin = recs.filter(r => r.status_masuk === 'tepat' && r.jam_masuk).length

  if (emp.tipe_gaji === 'harian') {
    const gajiKotor  = hariHadir * Number(emp.gaji_pokok)
    const bonusRajin = jumlahRajin * Number(emp.bonus_rajin)
    const totalTelat = jumlahTelat * Number(emp.potongan_telat)
    const gajiBersih = gajiKotor + bonusRajin - totalTelat
    return { gajiKotor, potonganAbsen: 0, potonganTelat: totalTelat, bonusRajin, gajiBersih, hariKerja, hariHadir, hariAbsen, jumlahTelat, jumlahRajin }
  }

  // bulanan
  const gajiKotor     = Number(emp.gaji_pokok)
  const potonganAbsen = hariAbsen  * Number(emp.potongan_absen)
  const potonganTelat = jumlahTelat * Number(emp.potongan_telat)
  const bonusRajin    = jumlahRajin * Number(emp.bonus_rajin)
  const gajiBersih    = gajiKotor - potonganAbsen - potonganTelat + bonusRajin
  return { gajiKotor, potonganAbsen, potonganTelat, bonusRajin, gajiBersih, hariKerja, hariHadir, hariAbsen, jumlahTelat, jumlahRajin }
}

export const fmtRupiah = (n) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID')

// time compare: "08:05" > "08:00" => true
export const isLate  = (actual, scheduled) => actual > scheduled
export const isEarly = (actual, scheduled) => actual < scheduled

export const minutesDiff = (a, b) => {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (ah * 60 + am) - (bh * 60 + bm)
}

// ─── Geolocation helpers ─────────────────────────────────────────────────────
/**
 * Hitung jarak antara dua titik koordinat (Haversine formula)
 * @returns {number} jarak dalam meter
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser Anda.'))
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true }
      )
    }
  })
}
