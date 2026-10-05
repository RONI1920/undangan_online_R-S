/* ════════════════════════════════════════
   Undangan Online — Anisa & Rido
════════════════════════════════════════ */
(() => {
    'use strict';

    // ── KONFIGURASI ─────────────────────────────────────
    const CONFIG = {
        // Akad nikah, WIB (UTC+7)
        eventDate: new Date('2027-01-09T14:00:00+07:00'),
        // Resepsi selesai (perkiraan) — setelah ini hitung mundur menampilkan ucapan terima kasih
        eventEnd: new Date('2027-01-10T17:00:00+07:00'),
        defaultGuest: 'Tamu Undangan',
        // Kunci "anon" Supabase memang publik. Keamanannya ditentukan oleh Row Level Security (lihat README.md).
        rsvp: {
            url: 'https://nkbqjdmiwmfbejbqsdyl.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYnFqZG1pd21mYmVqYnFzZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTAxMzUsImV4cCI6MjA5MTU4NjEzNX0.-58DEvE2wD3Y1NJbqIBI0qjCZ51gKRZpcemkkvevrgo'
        },
        guestbook: {
            url: 'https://cykktrwcbtkcbvgqshiw.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2t0cndjYnRrY2J2Z3FzaGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODE0NTMsImV4cCI6MjA5MjI1NzQ1M30.ejk0OoR3_fTKF8Lyn86sxklmWyoRkDdGfqP84LUrjwA'
        },
        submitCooldownMs: 20000
    };

    const $ = (id) => document.getElementById(id);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── UTIL ────────────────────────────────────────────
    function makeClient({ url, key }) {
        try {
            if (window.supabase && window.supabase.createClient) {
                return window.supabase.createClient(url, key, { auth: { persistSession: false } });
            }
        } catch (err) { console.error('Supabase init gagal:', err); }
        return null;
    }
    const dbRsvp = makeClient(CONFIG.rsvp);
    const dbGuestbook = makeClient(CONFIG.guestbook);

    let toastTimer;
    function toast(message, isError = false) {
        const el = $('toast');
        if (!el) return;
        el.textContent = message;
        el.classList.toggle('error', isError);
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
    }

    function setStatus(id, message, type) {
        const el = $(id);
        if (!el) return;
        el.textContent = message || '';
        el.className = 'form-status' + (type ? ' ' + type : '');
    }

    function lastSubmitOk(key) {
        let last = 0;
        try { last = Number(localStorage.getItem(key)) || 0; } catch (e) { /* storage diblokir */ }
        return Date.now() - last > CONFIG.submitCooldownMs;
    }
    function markSubmit(key) {
        try { localStorage.setItem(key, String(Date.now())); } catch (e) { /* abaikan */ }
    }

    function timeAgo(date) {
        const d = new Date(date);
        if (isNaN(d)) return '';
        const seconds = Math.floor((Date.now() - d) / 1000);
        const units = [['tahun', 31536000], ['bulan', 2592000], ['hari', 86400], ['jam', 3600], ['menit', 60]];
        for (const [name, secs] of units) {
            const n = Math.floor(seconds / secs);
            if (n > 0) return `${n} ${name} lalu`;
        }
        return 'Baru saja';
    }

    // ── NAMA TAMU (?to=Nama) ───────────────────────────
    let guestName = CONFIG.defaultGuest;
    let hasPersonalGuest = false;

    function initGuestName() {
        const params = new URLSearchParams(window.location.search);
        // URLSearchParams sudah men-decode; jangan decode dua kali (bisa melempar error untuk tanda %)
        const raw = (params.get('to') || params.get('nama') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
        if (raw) {
            guestName = raw;
            hasPersonalGuest = true;
        }
        // textContent => aman dari XSS, tidak perlu escape manual
        $('guest-name').textContent = guestName;

        if (hasPersonalGuest) {
            $('rsvp-name').value = guestName;
            $('gb-name').value = guestName;
        }
    }

    // ── PARTIKEL COVER ──────────────────────────────────
    function initParticles() {
        const container = $('particles');
        if (!container || reduceMotion) return;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 24; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = 1 + Math.random() * 2;
            p.style.cssText = `left:${Math.random() * 100}%;--dur:${5 + Math.random() * 6}s;--delay:${Math.random() * 6}s;width:${size}px;height:${size}px;`;
            frag.appendChild(p);
        }
        container.appendChild(frag);
    }

    // ── MUSIK ───────────────────────────────────────────
    const music = { el: null, btn: null, on: false, resumeAfterHide: false };

    function setMusicUI(on) {
        music.on = on;
        music.btn.classList.toggle('playing', on);
        music.btn.setAttribute('aria-pressed', String(on));
        music.btn.setAttribute('aria-label', on ? 'Jeda musik' : 'Putar musik');
    }

    async function playMusic() {
        try {
            await music.el.play();
            setMusicUI(true);
        } catch (err) {
            setMusicUI(false); // diblokir browser — pengguna bisa menekan tombol musik
        }
    }

    function initMusic() {
        music.el = $('bg-music');
        music.btn = $('music-btn');
        if (!music.el || !music.btn) return;
        music.el.volume = 0.45;
        music.btn.addEventListener('click', () => {
            if (music.on) { music.el.pause(); setMusicUI(false); } else { playMusic(); }
        });
        // Jeda otomatis saat tab disembunyikan, lanjut saat kembali
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && music.on) {
                music.resumeAfterHide = true;
                music.el.pause();
                setMusicUI(false);
            } else if (!document.hidden && music.resumeAfterHide) {
                music.resumeAfterHide = false;
                playMusic();
            }
        });
    }

    // ── BUKA UNDANGAN ───────────────────────────────────
    let opened = false;
    function openInvitation() {
        if (opened) return;
        opened = true;
        const cover = $('cover');
        cover.classList.add('hidden');
        cover.setAttribute('aria-hidden', 'true');
        cover.inert = true;
        document.body.classList.remove('locked');
        document.body.classList.add('is-open');
        $('main').removeAttribute('aria-hidden');
        window.scrollTo(0, 0);
        playMusic(); // dipicu klik pengguna => diizinkan browser
        initCountdown();
        initReveal();
        initNav();
        loadGuestbook();
    }

    // ── HITUNG MUNDUR ───────────────────────────────────
    function initCountdown() {
        const ids = ['cd-days', 'cd-hours', 'cd-mins', 'cd-secs'].map($);
        const status = $('cd-status');
        const pad = (n) => String(n).padStart(2, '0');

        function tick() {
            const now = Date.now();
            const diff = CONFIG.eventDate - now;
            if (diff <= 0) {
                ids.forEach((el) => { el.textContent = '00'; });
                status.textContent = now < CONFIG.eventEnd
                    ? 'Acara sedang berlangsung — terima kasih atas kehadiran dan doanya 🤍'
                    : 'Terima kasih atas doa dan kehadiran Anda 🤍';
                if (timer) clearInterval(timer);
                return;
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            [d, h, m, s].forEach((v, i) => { ids[i].textContent = pad(v); });
        }
        tick();
        const timer = setInterval(() => { if (!document.hidden) tick(); }, 1000);
    }

    // ── SCROLL REVEAL ───────────────────────────────────
    function initReveal() {
        const items = document.querySelectorAll('.reveal, .story-item');
        if (!('IntersectionObserver' in window)) {
            items.forEach((el) => el.classList.add('visible'));
            return;
        }
        const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.12 });
        items.forEach((el) => obs.observe(el));
    }

    // ── NAVIGASI (desktop + mobile) & SCROLL-SPY ────────
    function initNav() {
        const nav = $('nav');
        const hero = $('hero');
        if (!('IntersectionObserver' in window)) { nav.classList.add('show'); return; }

        // Navbar atas muncul setelah hero lewat
        new IntersectionObserver(([entry]) => {
            nav.classList.toggle('show', !entry.isIntersecting);
        }, { threshold: 0 }).observe(hero);

        // Tandai menu aktif sesuai section di tengah layar
        const links = document.querySelectorAll('#nav a[href^="#"], .bottom-nav a[href^="#"]');
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                const matching = [...links].filter((a) => a.getAttribute('href') === '#' + id);
                if (!matching.length) return;
                links.forEach((a) => {
                    const on = a.getAttribute('href') === '#' + id;
                    a.classList.toggle('active', on);
                    if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
                });
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        document.querySelectorAll('main section[id]').forEach((s) => spy.observe(s));
    }

    // ── RSVP ────────────────────────────────────────────
    function normalizePhone(value) {
        return value.replace(/[\s\-().]/g, '');
    }
    function isValidPhone(value) {
        // Nomor Indonesia: 08xx / 628xx / +628xx (9–14 digit setelah awalan)
        return /^(\+62|62|0)8\d{7,12}$/.test(normalizePhone(value));
    }

    function fieldError(inputId, message) {
        const input = $(inputId);
        const err = $(inputId + '-err');
        if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (err) err.textContent = message || '';
    }

    const RSVP_NOTES = {
        hadir: 'Kami menantikan kehadiranmu. Sampai jumpa di hari bahagia kami!',
        tidak: 'Terima kasih sudah memberi kabar. Doa restumu sangat berarti bagi kami.',
        mungkin: 'Terima kasih! Kabari kami lagi bila rencanamu sudah pasti ya.'
    };

    function initRsvp() {
        const form = $('rsvp-form');
        const success = $('rsvp-success');
        const countGroup = $('guest-count-group');

        // Sembunyikan "Jumlah Tamu" bila tidak hadir
        form.addEventListener('change', (e) => {
            if (e.target.name === 'hadir') countGroup.hidden = e.target.value === 'tidak';
        });

        $('rsvp-name').addEventListener('input', () => fieldError('rsvp-name', ''));
        $('rsvp-phone').addEventListener('input', () => fieldError('rsvp-phone', ''));

        $('rsvp-again').addEventListener('click', () => {
            success.hidden = true;
            form.hidden = false;
            form.reset();
            countGroup.hidden = false;
            if (hasPersonalGuest) $('rsvp-name').value = '';
            setStatus('rsvp-status', '');
            $('rsvp-name').focus();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if ($('rsvp-hp').value) return; // bot

            const nama = $('rsvp-name').value.replace(/\s+/g, ' ').trim();
            const noHp = $('rsvp-phone').value.trim();
            const hadir = form.querySelector('input[name="hadir"]:checked').value;
            const jumlah = parseInt($('guest-count').value, 10) || 1;

            let valid = true;
            if (nama.length < 2) { fieldError('rsvp-name', 'Mohon isi nama lengkap.'); valid = false; }
            if (noHp && !isValidPhone(noHp)) {
                fieldError('rsvp-phone', 'Format nomor belum sesuai. Contoh: 0812 3456 7890');
                valid = false;
            }
            if (!valid) {
                const firstBad = form.querySelector('[aria-invalid="true"]');
                if (firstBad) firstBad.focus();
                return;
            }
            if (!dbRsvp) { setStatus('rsvp-status', 'Layanan belum tersedia. Periksa koneksi lalu muat ulang halaman.', 'error'); return; }
            if (!lastSubmitOk('rsvp_last')) { setStatus('rsvp-status', 'Mohon tunggu sebentar sebelum mengirim lagi.', 'error'); return; }

            const btn = $('rsvp-submit');
            btn.disabled = true;
            btn.textContent = 'Mengirim…';
            setStatus('rsvp-status', '');

            try {
                const { error } = await dbRsvp.from('rsvp').insert([{
                    nama,
                    no_hp: noHp ? normalizePhone(noHp) : null,
                    kehadiran: hadir,
                    jumlah_tamu: jumlah
                }]);
                if (error) throw error;

                markSubmit('rsvp_last');
                $('rsvp-success-note').textContent = RSVP_NOTES[hadir] || RSVP_NOTES.hadir;
                form.hidden = true;
                success.hidden = false;
                success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
                success.focus({ preventScroll: true });
            } catch (err) {
                console.error('RSVP error:', err);
                setStatus('rsvp-status', 'Maaf, konfirmasi belum terkirim. Silakan coba lagi.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Kirim Konfirmasi';
            }
        });
    }

    // ── BUKU TAMU ───────────────────────────────────────
    let loadingGuestbook = false;

    function buildCard(item) {
        const card = document.createElement('div');
        card.className = 'gb-message';

        const head = document.createElement('div');
        head.className = 'gb-message-header';
        const name = document.createElement('span');
        name.className = 'gb-name';
        name.textContent = item.nama || 'Tamu';
        const time = document.createElement('span');
        time.className = 'gb-time';
        time.textContent = timeAgo(item.created_at);
        head.append(name, time);

        const text = document.createElement('p');
        text.className = 'gb-text';
        text.textContent = item.pesan || '';

        const star = document.createElement('div');
        star.className = 'gb-star';
        star.setAttribute('aria-hidden', 'true');
        star.textContent = '✦ ✦ ✦';

        card.append(head, text, star);
        return card;
    }

    function renderGuestbook(data) {
        const track = $('gb-track');
        const slider = $('gb-slider');
        track.replaceChildren();
        track.className = 'review-slider-track';

        const makeGroup = (hidden) => {
            const g = document.createElement('div');
            g.className = 'gb-group';
            if (hidden) g.setAttribute('aria-hidden', 'true');
            data.forEach((item) => g.appendChild(buildCard(item)));
            return g;
        };

        // Sedikit ucapan: tampilkan statis (tanpa marquee dengan kartu berulang)
        if (data.length < 4 || reduceMotion) {
            track.classList.add('is-static');
            track.appendChild(makeGroup(false));
            if (reduceMotion && data.length >= 4) slider.style.overflowX = 'auto';
            return;
        }
        track.append(makeGroup(false), makeGroup(true));
        track.style.setProperty('--gb-dur', Math.max(30, data.length * 6) + 's');
        track.classList.add('is-animated');
    }

    async function loadGuestbook() {
        const track = $('gb-track');
        if (!track || loadingGuestbook) return;
        if (!dbGuestbook) {
            track.innerHTML = '<div class="review-loading">Ucapan belum dapat dimuat.</div>';
            return;
        }
        loadingGuestbook = true;
        try {
            const { data, error } = await dbGuestbook
                .from('guestbook')
                .select('nama,pesan,created_at')
                .order('created_at', { ascending: false })
                .limit(30);
            if (error) throw error;
            if (!data || !data.length) {
                track.className = 'review-slider-track is-static';
                track.innerHTML = '<div class="review-loading">Jadilah yang pertama mengirim ucapan 💌</div>';
                return;
            }
            renderGuestbook(data);
        } catch (err) {
            console.error('Guestbook error:', err);
            track.className = 'review-slider-track is-static';
            track.innerHTML = '<div class="review-loading">Ucapan belum dapat dimuat. Coba muat ulang halaman.</div>';
        } finally {
            loadingGuestbook = false;
        }
    }

    function initGuestbook() {
        const form = $('gb-form');
        const msg = $('gb-msg');
        const counter = $('gb-count');
        const slider = $('gb-slider');

        msg.addEventListener('input', () => { counter.textContent = `${msg.value.length} / 500`; });

        // Sentuh slider => jeda; lanjut otomatis setelah beberapa detik
        let resumeTimer;
        slider.addEventListener('pointerdown', () => {
            slider.classList.add('paused');
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => slider.classList.remove('paused'), 6000);
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if ($('gb-hp').value) return; // bot

            const nama = $('gb-name').value.replace(/\s+/g, ' ').trim();
            const pesan = msg.value.trim();

            if (nama.length < 2 || pesan.length < 3) {
                setStatus('gb-status', 'Mohon isi nama dan pesan terlebih dahulu.', 'error');
                (nama.length < 2 ? $('gb-name') : msg).focus();
                return;
            }
            if (!dbGuestbook) { setStatus('gb-status', 'Layanan belum tersedia. Muat ulang halaman.', 'error'); return; }
            if (!lastSubmitOk('gb_last')) { setStatus('gb-status', 'Mohon tunggu sebentar sebelum mengirim ucapan lagi.', 'error'); return; }

            const btn = $('gb-submit');
            btn.disabled = true;
            btn.textContent = 'Mengirim…';
            setStatus('gb-status', '');

            try {
                const { error } = await dbGuestbook.from('guestbook').insert([{ nama: nama.slice(0, 60), pesan: pesan.slice(0, 500) }]);
                if (error) throw error;
                markSubmit('gb_last');
                msg.value = '';
                counter.textContent = '0 / 500';
                setStatus('gb-status', 'Terima kasih! Ucapanmu sudah terkirim 💌', 'ok');
                toast('Ucapan berhasil dikirim 💌');
                await loadGuestbook();
            } catch (err) {
                console.error('Guestbook submit error:', err);
                setStatus('gb-status', 'Maaf, ucapan belum terkirim. Silakan coba lagi.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Kirim Ucapan 💌';
            }
        });
    }

    // ── SALIN NOMOR REKENING ────────────────────────────
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback untuk browser lama / konteks non-HTTPS
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            ta.remove();
            return ok;
        }
    }

    function initCopy() {
        document.querySelectorAll('[data-copy]').forEach((btn) => {
            const original = btn.textContent;
            btn.addEventListener('click', async () => {
                const src = $(btn.dataset.copy);
                if (!src) return;
                const ok = await copyToClipboard(src.textContent.trim());
                toast(ok ? 'Nomor rekening disalin ✓' : 'Gagal menyalin. Tekan lama pada nomor untuk menyalin.', !ok);
                if (ok) {
                    btn.textContent = 'Tersalin ✓';
                    btn.classList.add('done');
                    setTimeout(() => { btn.textContent = original; btn.classList.remove('done'); }, 2000);
                }
            });
        });
    }

    // ── INIT ────────────────────────────────────────────
    function init() {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);

        const year = $('year');
        if (year) year.textContent = new Date().getFullYear();

        initGuestName();
        initParticles();
        initMusic();
        initRsvp();
        initGuestbook();
        initCopy();
        $('btn-open').addEventListener('click', openInvitation);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
