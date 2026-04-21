# 🚀 Panduan Deploy Sistem Absensi
## Stack: React + Supabase + Vercel

---

## LANGKAH 1 — Supabase (Database)

### 1.1 Buat Project
1. Buka https://supabase.com → **New Project**
2. Pilih nama project (cth: `sistem-absensi`)
3. Set password database yang kuat
4. Pilih region: **Southeast Asia (Singapore)**

### 1.2 Jalankan Schema
1. Di sidebar Supabase → **SQL Editor** → **New query**
2. Copy-paste seluruh isi file `supabase_schema.sql`
3. Klik **Run** → pastikan tidak ada error

### 1.3 Ambil Credentials
1. Di sidebar → **Settings** → **API**
2. Catat:
   - `Project URL` → ini adalah `VITE_SUPABASE_URL`
   - `anon public` key → ini adalah `VITE_SUPABASE_ANON_KEY`

---

## LANGKAH 2 — GitHub (Source Control)

### 2.1 Buat Repository
```bash
# Di terminal, masuk ke folder project
cd sistem-absensi

# Inisialisasi git
git init
git add .
git commit -m "feat: initial commit sistem absensi"

# Buat repo baru di GitHub (github.com/new)
# Lalu push:
git remote add origin https://github.com/USERNAME/sistem-absensi.git
git branch -M main
git push -u origin main
```

---

## LANGKAH 3 — Vercel (Deploy)

### 3.1 Import dari GitHub
1. Buka https://vercel.com → **Add New Project**
2. Pilih **Import** dari repo GitHub yang baru dibuat
3. Framework preset: **Vite** (otomatis terdeteksi)

### 3.2 Set Environment Variables
Di halaman **Configure Project**, klik **Environment Variables** dan tambahkan:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5c...` |

### 3.3 Deploy
Klik **Deploy** → tunggu 1-2 menit → ✅ Selesai!

URL app Anda: `https://sistem-absensi-xxx.vercel.app`

---

## LANGKAH 4 — Penggunaan

### Login
| Role | PIN |
|------|-----|
| Owner | `0000` |
| Budi Santoso | `1234` |
| Sari Dewi | `5678` |
| Andi Pratama | `9999` |

### Ubah PIN & Data Karyawan
Login sebagai Owner → Tab **Setting** → Edit karyawan

---

## LANGKAH 5 — Update Otomatis
Setiap `git push` ke branch `main` akan otomatis deploy ulang di Vercel.

```bash
git add .
git commit -m "update: ..."
git push
```

---

## Struktur Folder
```
sistem-absensi/
├── src/
│   ├── components/
│   │   ├── Camera.jsx          # Komponen kamera selfie
│   │   ├── PinScreen.jsx       # Halaman login PIN
│   │   ├── EmployeePage.jsx    # Halaman absen karyawan
│   │   └── OwnerDashboard.jsx  # Dashboard owner (grafik, gaji, setting)
│   ├── hooks/
│   │   └── useData.js          # Custom hooks Supabase
│   ├── lib/
│   │   ├── supabase.js         # Supabase client
│   │   └── utils.js            # Helper & kalkulasi gaji
│   ├── App.jsx
│   └── main.jsx
├── supabase_schema.sql         # ← Jalankan ini di Supabase SQL Editor
├── .env.example                # ← Copy ke .env lalu isi credentials
├── vercel.json
├── vite.config.js
└── package.json
```

---

## Troubleshooting

**Kamera tidak muncul?**
→ Pastikan akses HTTPS (bukan HTTP). Vercel otomatis HTTPS. ✅

**Data tidak tersimpan?**
→ Cek environment variables di Vercel → Settings → Environment Variables

**Error "relation does not exist"?**
→ Jalankan ulang `supabase_schema.sql` di Supabase SQL Editor

**Foto terlalu besar?**
→ Foto disimpan sebagai base64 di kolom `text`. Untuk produksi besar,
   pertimbangkan upload ke Supabase Storage dan simpan URL-nya saja.
