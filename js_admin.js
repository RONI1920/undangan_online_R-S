/* ════════════════════════════════════════
   Admin undangan — wajib login (Supabase Auth)
   Pastikan RLS sudah aktif: lihat README.md
════════════════════════════════════════ */
(() => {
    'use strict';

    const BASE_URL = 'https://invitationonline.my.id/';
    const SUPABASE_URL = 'https://cykktrwcbtkcbvgqshiw.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2t0cndjYnRrY2J2Z3FzaGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODE0NTMsImV4cCI6MjA5MjI1NzQ1M30.ejk0OoR3_fTKF8Lyn86sxklmWyoRkDdGfqP84LUrjwA';

    const $ = (id) => document.getElementById(id);
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    let guests = [];

    // ── UI helper ───────────────────────────────────────
    let toastTimer;
    function toast(msg, isError = false) {
        const el = $('toast');
        el.textContent = msg;
        el.classList.toggle('error', isError);
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
    }

    function setMsg(id, text, type) {
        const el = $(id);
        el.textContent = text || '';
        el.className = 'msg' + (type ? ' ' + type : '');
    }

    async function copyText(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (e) {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
            ta.remove();
            return ok;
        }
    }

    // ── Template pesan WhatsApp ─────────────────────────
    function buildLink(nama) {
        return `${BASE_URL}?to=${encodeURIComponent(nama)}`;
    }

    function buildMessage(nama, link) {
        return `Kepada Yth.
Bapak/Ibu/Saudara/i
${nama}

Assalamu’alaikum Warahmatullahi Wabarakatuh

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Pernikahan kami:

Nama:
Anisa Khairoza, S.AP. & Rido Fernando, ATT IV

Akad Nikah:
Sabtu, 9 Januari 2027, 14.00 WIB s/d selesai

Resepsi:
Minggu, 10 Januari 2027, 10.00 WIB s/d selesai

Tempat:
Jln. Pemancungan No. 13 RT 002 RW 006 Kel. Pasa Gadang, Kec. Padang Selatan, Kota Padang

Untuk informasi detail lokasi, rundown acara, dan undangan digital, silakan klik link berikut:
${link}

Wassalamu’alaikum Warahmatullahi Wabarakatuh

Hormat kami,
Keluarga Besar Kedua Mempelai`;
    }

    // ── Auth ────────────────────────────────────────────
    function showView(loggedIn) {
        $('login-view').hidden = loggedIn;
        $('app-view').hidden = !loggedIn;
        if (loggedIn) loadGuests(); else $('email').focus();
    }

    async function initAuth() {
        const { data } = await sb.auth.getSession();
        showView(!!data.session);
        sb.auth.onAuthStateChange((_event, session) => showView(!!session));
    }

    $('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = $('email').value.trim();
        const password = $('password').value;
        if (!email || !password) { setMsg('login-msg', 'Email dan kata sandi wajib diisi.', 'error'); return; }
        const btn = $('login-btn');
        btn.disabled = true;
        setMsg('login-msg', '');
        const { error } = await sb.auth.signInWithPassword({ email, password });
        btn.disabled = false;
        if (error) {
            setMsg('login-msg', 'Email atau kata sandi salah.', 'error');
            return;
        }
        $('password').value = '';
    });

    $('logout-btn').addEventListener('click', async () => {
        await sb.auth.signOut();
        guests = [];
    });

    // ── Data tamu ───────────────────────────────────────
    async function loadGuests() {
        const list = $('list');
        list.innerHTML = '<div class="empty">Memuat…</div>';
        const { data, error } = await sb.from('tamu').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error(error);
            list.innerHTML = '';
            const div = document.createElement('div');
            div.className = 'empty';
            div.textContent = 'Gagal memuat data. Pastikan akun ini punya akses (lihat README.md).';
            list.appendChild(div);
            return;
        }
        guests = data || [];
        render();
    }

    function render() {
        const q = $('search').value.trim().toLowerCase();
        const shown = guests.filter((g) => !q || (g.nama || '').toLowerCase().includes(q));
        $('count').textContent = guests.length;

        const list = $('list');
        list.replaceChildren();
        if (!shown.length) {
            const div = document.createElement('div');
            div.className = 'empty';
            div.textContent = guests.length ? 'Tidak ada tamu yang cocok.' : 'Belum ada tamu. Tambahkan di atas.';
            list.appendChild(div);
            return;
        }

        shown.forEach((g) => {
            const link = g.link || buildLink(g.nama);
            const item = document.createElement('div');
            item.className = 'item';

            const title = document.createElement('div');
            title.className = 'item-title';
            title.textContent = g.nama;

            const small = document.createElement('small');
            small.textContent = g.created_at ? new Date(g.created_at).toLocaleString('id-ID') : '';

            const linkEl = document.createElement('div');
            linkEl.className = 'item-link';
            linkEl.textContent = link;

            const actions = document.createElement('div');
            actions.className = 'item-actions';
            actions.append(
                makeBtn('📋 Salin Link', async () => toast(await copyText(link) ? 'Link disalin ✓' : 'Gagal menyalin', false)),
                makeBtn('📋 Salin Pesan', async () => toast(await copyText(g.wa_text || buildMessage(g.nama, link)) ? 'Pesan disalin ✓' : 'Gagal menyalin', false)),
                makeBtn('📤 Kirim WA', () => {
                    const text = g.wa_text || buildMessage(g.nama, link);
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
                }),
                makeBtn('🗑 Hapus', () => deleteGuest(g), 'danger')
            );

            item.append(title, small, linkEl, actions);
            list.appendChild(item);
        });
    }

    function makeBtn(label, onClick, extra) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn small' + (extra ? ' ' + extra : '');
        b.textContent = label;
        b.addEventListener('click', onClick);
        return b;
    }

    async function deleteGuest(g) {
        if (!confirm(`Hapus "${g.nama}" dari daftar tamu?`)) return;
        const { error } = await sb.from('tamu').delete().eq('id', g.id);
        if (error) { console.error(error); toast('Gagal menghapus (cek izin DELETE di Supabase)', true); return; }
        guests = guests.filter((x) => x.id !== g.id);
        render();
        toast('Tamu dihapus');
    }

    // ── Tambah tamu (tanpa duplikat) ────────────────────
    $('add-btn').addEventListener('click', async () => {
        const names = $('listNama').value.split('\n').map((n) => n.replace(/\s+/g, ' ').trim()).filter(Boolean);
        if (!names.length) { setMsg('add-msg', 'Isi dulu minimal satu nama tamu.', 'error'); return; }

        const existing = new Set(guests.map((g) => (g.nama || '').toLowerCase()));
        const seen = new Set();
        const fresh = [];
        let skipped = 0;
        names.forEach((nama) => {
            const key = nama.toLowerCase();
            if (existing.has(key) || seen.has(key)) { skipped++; return; }
            seen.add(key);
            const link = buildLink(nama);
            fresh.push({ nama, link, wa_text: buildMessage(nama, link) });
        });

        if (!fresh.length) { setMsg('add-msg', 'Semua nama sudah ada di daftar.', 'error'); return; }

        const btn = $('add-btn');
        btn.disabled = true;
        setMsg('add-msg', 'Menyimpan…');
        const { error } = await sb.from('tamu').insert(fresh);
        btn.disabled = false;
        if (error) {
            console.error(error);
            setMsg('add-msg', 'Gagal menyimpan. Pastikan sudah masuk dan izin INSERT aktif (lihat README.md).', 'error');
            return;
        }
        $('listNama').value = '';
        setMsg('add-msg', `${fresh.length} tamu disimpan${skipped ? `, ${skipped} nama duplikat dilewati` : ''}.`, 'ok');
        await loadGuests();
    });

    // ── Salin semua / CSV ───────────────────────────────
    $('copy-all').addEventListener('click', async () => {
        if (!guests.length) { toast('Belum ada tamu', true); return; }
        const text = guests.map((g) => g.wa_text || buildMessage(g.nama, g.link || buildLink(g.nama)))
            .join('\n\n————————————————\n\n');
        toast(await copyText(text) ? `${guests.length} pesan disalin ✓` : 'Gagal menyalin', false);
    });

    $('export-csv').addEventListener('click', () => {
        if (!guests.length) { toast('Belum ada tamu', true); return; }
        const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [['Nama', 'Link', 'Dibuat'], ...guests.map((g) => [g.nama, g.link || buildLink(g.nama), g.created_at])];
        const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        a.download = 'daftar-tamu.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    });

    $('reload').addEventListener('click', loadGuests);
    $('search').addEventListener('input', render);

    initAuth();
})();
