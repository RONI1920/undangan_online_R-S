# Undangan Online — Anisa & Rido

Situs statis (HTML/CSS/JS) + Supabase. Deploy ke GitHub Pages (`CNAME` sudah ada).

## Struktur

| File | Fungsi |
|---|---|
| `index.html`, `style.css`, `script.js` | Halaman undangan untuk tamu |
| `admin.html`, `css_admin.css`, `js_admin.js` | Panel admin (wajib login) untuk membuat link tamu |
| `image/og-image.jpg` | Gambar preview WhatsApp/sosmed (1200×630, < 60 KB) |
| `music/cover_musik.mp3` | Musik latar (112 kbps, ±3 MB) |

Link personal tamu: `https://invitationonline.my.id/?to=Nama%20Tamu`

## ⚠️ Wajib sebelum go-live: aktifkan keamanan Supabase

Kunci `anon` di `script.js` / `js_admin.js` memang publik (itu normal di Supabase), jadi **satu-satunya pengaman adalah
Row Level Security (RLS)**. Tanpa RLS siapa pun bisa membaca/menghapus data lewat kunci itu.
Jalankan di *SQL Editor* masing-masing project.

### Project buku tamu & daftar tamu (`cykktrwcbtkcbvgqshiw`)

```sql
-- Buku tamu: semua orang boleh membaca & menulis, tidak boleh mengubah/menghapus
alter table public.guestbook enable row level security;

drop policy if exists "guestbook read"   on public.guestbook;
drop policy if exists "guestbook insert" on public.guestbook;

create policy "guestbook read" on public.guestbook
  for select to anon, authenticated using (true);

create policy "guestbook insert" on public.guestbook
  for insert to anon, authenticated
  with check (char_length(nama) between 2 and 60 and char_length(pesan) between 3 and 500);

-- Daftar tamu: HANYA admin yang sudah login
alter table public.tamu enable row level security;

drop policy if exists "tamu admin all" on public.tamu;
create policy "tamu admin all" on public.tamu
  for all to authenticated using (true) with check (true);
```

Lalu buat akun admin: **Authentication → Users → Add user** (email + kata sandi, centang *Auto Confirm*).
Matikan pendaftaran publik: **Authentication → Providers → Email → matikan "Allow new users to sign up"**,
supaya orang lain tidak bisa membuat akun sendiri dan ikut menjadi `authenticated`.

### Project RSVP (`nkbqjdmiwmfbejbqsdyl`)

Data RSVP berisi nomor HP tamu — jangan bisa dibaca publik.

```sql
alter table public.rsvp enable row level security;

drop policy if exists "rsvp insert only" on public.rsvp;
create policy "rsvp insert only" on public.rsvp
  for insert to anon
  with check (
    char_length(nama) between 2 and 80
    and kehadiran in ('hadir','tidak','mungkin')
    and jumlah_tamu between 0 and 20
  );
-- Tidak ada policy SELECT untuk anon => lihat data RSVP lewat Supabase Dashboard → Table Editor.
```

> Jika tabel Anda punya batasan lain (mis. kolom `NOT NULL`), sesuaikan. Setelah menjalankan SQL, uji:
> kirim RSVP & ucapan dari situs, lalu login di `/admin.html`.

## Catatan produksi

- `admin.html` tidak ditautkan dari halaman undangan dan memakai `noindex`. Keamanannya ada pada login + RLS di atas.
- Gambar latar `image/cover.jpg` hanya 564×382 px sehingga terlihat agak buram di layar besar. Ganti dengan foto ≥ 1600 px
  (nama file sama) bila ada.
- Ubah tanggal/hitung mundur di `script.js` → `CONFIG.eventDate` dan `CONFIG.eventEnd`.
- Tautan "Simpan ke Kalender" memakai perkiraan durasi (Akad 14.00–17.00, Resepsi 10.00–14.00 WIB). Ubah di `index.html` bila perlu.
