-- ============================================================
-- SISTEM ABSENSI — Supabase SQL Schema
-- Jalankan seluruh script ini di Supabase SQL Editor
-- ============================================================

-- 1. Tabel Karyawan
create table if not exists employees (
  id          uuid primary key default gen_random_uuid(),
  emp_code    text unique not null,
  name        text not null,
  role        text not null default '',
  pin         text not null default '0000',
  jam_masuk   time not null default '08:00',
  jam_pulang  time not null default '17:00',
  tipe_gaji   text not null default 'bulanan', -- 'bulanan' | 'harian'
  gaji_pokok  numeric not null default 0,
  potongan_absen   numeric not null default 0,   -- Rp per hari absen
  potongan_telat   numeric not null default 0,   -- Rp per kejadian telat
  bonus_rajin      numeric not null default 0,   -- Rp per hari hadir penuh
  created_at  timestamptz default now()
);

-- 2. Tabel Absensi
create table if not exists attendance (
  id           uuid primary key default gen_random_uuid(),
  employee_id  uuid references employees(id) on delete cascade,
  tanggal      date not null,
  jam_masuk    time,
  jam_pulang   time,
  foto_masuk   text,   -- base64 atau URL
  foto_pulang  text,
  status_masuk text default 'tepat', -- 'tepat' | 'telat'
  status_pulang text default 'tepat', -- 'tepat' | 'lebih_awal'
  menit_telat  int default 0,
  created_at   timestamptz default now(),
  unique(employee_id, tanggal)
);

-- 3. Row Level Security (RLS) — nonaktifkan untuk akses publik PIN-based
alter table employees enable row level security;
alter table attendance enable row level security;

-- Policy: izinkan semua operasi (autentikasi berbasis PIN di app)
create policy "allow_all_employees" on employees for all using (true) with check (true);
create policy "allow_all_attendance" on attendance for all using (true) with check (true);

-- 4. Index performa
create index if not exists idx_attendance_emp_date on attendance(employee_id, tanggal);
create index if not exists idx_attendance_date on attendance(tanggal);

-- 5. Data awal (opsional — hapus jika ingin mulai kosong)
insert into employees (emp_code, name, role, pin, jam_masuk, jam_pulang, tipe_gaji, gaji_pokok, potongan_absen, potongan_telat, bonus_rajin)
values
  ('E001', 'Budi Santoso',  'Staff Gudang', '1234', '08:00', '17:00', 'bulanan', 3000000, 150000, 25000, 50000),
  ('E002', 'Sari Dewi',     'Kasir',        '5678', '09:00', '18:00', 'harian',  150000,  0,      0,     0),
  ('E003', 'Andi Pratama',  'Supervisor',   '9999', '07:30', '16:30', 'bulanan', 5000000, 200000, 50000, 100000)
on conflict (emp_code) do nothing;

-- 6. Tabel Pengaturan (Settings)
create table if not exists settings (
  id          text primary key default 'global',
  lat         numeric,
  lng         numeric,
  radius      int default 100, -- dalam meter
  updated_at  timestamptz default now()
);

-- Masukkan data awal pengaturan lokasi (default: Jakarta)
insert into settings (id, lat, lng, radius)
values ('global', -6.200000, 106.816666, 100)
on conflict (id) do nothing;

-- Aktifkan RLS untuk settings
alter table settings enable row level security;
create policy "allow_all_settings" on settings for all using (true) with check (true);

-- 7. Tabel Outlet
create table if not exists outlets (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  lat         numeric not null,
  lng         numeric not null,
  radius      int default 100,
  created_at  timestamptz default now()
);

-- Tambahkan kolom outlet_id ke tabel employees
alter table employees add column if not exists outlet_id uuid references outlets(id) on delete set null;

-- Masukkan data outlet awal
insert into outlets (name, address, lat, lng, radius)
values ('Outlet Utama', 'Alamat Pusat', -6.200000, 106.816666, 100)
on conflict do nothing;

-- Aktifkan RLS untuk outlets
alter table outlets enable row level security;
create policy "allow_all_outlets" on outlets for all using (true) with check (true);

-- 8. Tabel Audit Log
create table if not exists audit_logs (
  id          uuid primary key default gen_random_uuid(),
  user_role   text not null, -- 'owner' | 'employee'
  user_id     uuid,          -- ID karyawan jika employee, null jika owner
  action      text not null, -- 'create' | 'update' | 'delete'
  table_name  text not null,
  record_id   uuid not null,
  old_data    jsonb,
  new_data    jsonb,
  created_at  timestamptz default now()
);

alter table audit_logs enable row level security;
create policy "allow_all_logs" on audit_logs for all using (true) with check (true);
