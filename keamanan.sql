-- ═══ KEAMANAN SUPABASE — jalankan di project cykktrwcbtkcbvgqshiw ═══
-- GANTI email di bawah (2 tempat sama) dengan email admin Anda.

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'EMAIL_ADMIN_ANDA@gmail.com'
$$;

-- 1. Cabut semua izin anon, beri hanya yang perlu
revoke all on public.tamu, public.rsvp, public.guestbook from anon, authenticated;
grant insert on public.rsvp to anon;
grant select, insert on public.guestbook to anon;
grant select, insert, update, delete on public.tamu, public.rsvp to authenticated;
grant select, insert on public.guestbook to authenticated;

-- 2. RLS aktif di semua tabel
alter table public.tamu      enable row level security;
alter table public.rsvp      enable row level security;
alter table public.guestbook enable row level security;

-- 3. TAMU: hanya admin (bukan sekadar "sudah login")
drop policy if exists "tamu admin all" on public.tamu;
create policy "tamu admin all" on public.tamu
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4. RSVP: publik hanya boleh KIRIM; hanya admin boleh baca/ubah/hapus
drop policy if exists "rsvp insert only" on public.rsvp;
drop policy if exists "rsvp admin read"  on public.rsvp;
drop policy if exists "rsvp admin all"   on public.rsvp;
create policy "rsvp insert only" on public.rsvp
  for insert to anon
  with check (
    char_length(btrim(nama)) between 2 and 80
    and kehadiran in ('hadir','tidak','mungkin')
    and jumlah_tamu between 0 and 20
    and (no_hp is null or char_length(no_hp) <= 20)
  );
create policy "rsvp admin all" on public.rsvp
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. BUKU TAMU: baca & tulis publik, tidak bisa ubah/hapus
drop policy if exists "guestbook read"   on public.guestbook;
drop policy if exists "guestbook insert" on public.guestbook;
create policy "guestbook read" on public.guestbook
  for select to anon, authenticated using (true);
create policy "guestbook insert" on public.guestbook
  for insert to anon, authenticated
  with check (char_length(btrim(nama)) between 2 and 60 and char_length(btrim(pesan)) between 3 and 500);

-- 6. Satu nama hanya satu RSVP
create unique index if not exists rsvp_nama_unik on public.rsvp (lower(btrim(nama)));
