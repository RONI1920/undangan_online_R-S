// ── CONFIG ──────────────────────────────────────────
const CONFIG = {
    bride: "Rudi Putra",
    groom: "Fulan",
    eventName: "Pernikahan",
    eventDate: new Date("2026-05-02T00:00:00")
};

// ── GLOBAL STATE ─────────────────────────────────────
let audio = null;
let playing = false;
let guestName = "Bapak/Ibu/Saudara/i";

// ── INIT ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initGuestName();
    initParticles();
    initMusic();
});

// ── PERSONAL LINK ─────────────────────────────────────
function initGuestName() {
    const urlParams = new URLSearchParams(window.location.search);
    const name = urlParams.get("to") || urlParams.get("nama");

    const finalName = name
        ? `Bapak/Ibu/Saudara/i ${decodeURIComponent(name)}`
        : "Bapak/Ibu/Saudara/i";

    const guestEl = document.getElementById("guest-name");
    if (guestEl) guestEl.textContent = finalName;
}

// ── PARTICLES ────────────────────────────────────────
function initParticles() {
    const container = document.getElementById("particles");
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.cssText = `
            left: ${Math.random() * 100}%;
            --dur: ${4 + Math.random() * 6}s;
            --delay: ${Math.random() * 6}s;
            width: ${1 + Math.random() * 2}px;
            height: ${1 + Math.random() * 2}px;
        `;
        container.appendChild(p);
    }
}

// ── OPEN INVITATION ──────────────────────────────────
function openInvitation() {
    const cover = document.getElementById("cover");
    const main = document.getElementById("main");
    const musicBtn = document.getElementById("music-btn");

    if (cover) cover.classList.add("hidden");
    if (main) main.classList.add("visible");

    setTimeout(() => {
        if (musicBtn) {
            musicBtn.classList.add("show"); // 🔥 ini kuncinya
        }
    }, 800);

    setTimeout(() => {
        if (cover) cover.style.display = "none";
        initAll();
    }, 800);
}


// ── COUNTDOWN ────────────────────────────────────────
function initCountdown() {
    function update() {
        const now = new Date();
        const diff = CONFIG.eventDate - now;

        if (diff <= 0) {
            document.querySelectorAll(".cd-num")
                .forEach(el => el.textContent = "00");
            return;
        }

        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        setText("cd-days", d);
        setText("cd-hours", h);
        setText("cd-mins", m);
        setText("cd-secs", s);
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = String(val).padStart(2, "0");
    }

    update();
    setInterval(update, 1000);
}

// ── SCROLL REVEAL ───────────────────────────────────
function initScrollReveal() {
    const elements = document.querySelectorAll(".reveal, .story-item");

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add("visible");
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.15 });

    elements.forEach(el => obs.observe(el));
}


// ── RSVP ────────────────────────────────────────────

const SUPABASE_URL = "https://nkbqjdmiwmfbejbqsdyl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rYnFqZG1pd21mYmVqYnFzZHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTAxMzUsImV4cCI6MjA5MTU4NjEzNX0.-58DEvE2wD3Y1NJbqIBI0qjCZ51gKRZpcemkkvevrgo";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function submitRSVP(e) {
    e.preventDefault();

    const form = document.getElementById("rsvp-form");
    const success = document.getElementById("rsvp-success");

    // ambil data dari form
    const nama = form.querySelector('input[type="text"]').value;
    const no_hp = form.querySelector('input[type="tel"]').value;

    const hadir = form.querySelector('input[name="hadir"]:checked').value;
    const jumlah = document.getElementById("guest-count").value;

    try {
        const { error } = await supabaseClient
            .from("rsvp")
            .insert([{
                nama: nama,
                no_hp: no_hp,
                kehadiran: hadir,
                jumlah_tamu: parseInt(jumlah)
            }]);

        if (error) throw error;

        // UI tetap sama seperti sekarang
        if (form) form.style.display = "none";
        if (success) {
            success.style.display = "block"; // 🔥 ini kuncinya
            success.classList.add("show");
        }

    } catch (err) {
        console.error("RSVP ERROR:", err);
        alert("Gagal mengirim RSVP 😢");
    }
}

// ── GUESTBOOK ───────────────────────────────────────
const messages = [
    { name: "Siti Aminah", msg: "Barakallah! 🌹", time: "2 jam lalu" },
];

function initGuestbook() {
    renderMessages();
}

function renderMessages() {
    const container = document.getElementById("gb-messages");
    if (!container) return;

    container.innerHTML = messages.map(m => `
        <div class="gb-message">
            <div class="gb-message-header">
                <span class="gb-name">${m.name}</span>
                <span class="gb-time">${m.time}</span>
            </div>
            <p class="gb-text">${m.msg}</p>
        </div>
    `).join("");
}

// ── SUPABASE INIT ──
const SUPABASE_URL_GB = "https://cykktrwcbtkcbvgqshiw.supabase.co";
const SUPABASE_KEY_GB = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2t0cndjYnRrY2J2Z3FzaGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODE0NTMsImV4cCI6MjA5MjI1NzQ1M30.ejk0OoR3_fTKF8Lyn86sxklmWyoRkDdGfqP84LUrjwA";

const supabaseGuestbook = supabase.createClient(
    SUPABASE_URL_GB,
    SUPABASE_KEY_GB
);

let isLoadingGuestbook = false;

// ── ESCAPE HTML ──
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[tag]));
}

// ── TIME FORMAT ──
function timeAgo(date) {
    const d = new Date(date);
    if (isNaN(d)) return "";

    const seconds = Math.floor((new Date() - d) / 1000);

    const intervals = {
        tahun: 31536000,
        bulan: 2592000,
        hari: 86400,
        jam: 3600,
        menit: 60
    };

    for (let key in intervals) {
        const interval = Math.floor(seconds / intervals[key]);
        if (interval > 0) return `${interval} ${key} lalu`;
    }

    return "Baru saja";
}

// ── LOAD GUESTBOOK + RENDER SLIDER ──────────────────
// ── LOAD GUESTBOOK + RENDER SLIDER ──────────────────
async function loadGuestbook() {
    if (isLoadingGuestbook) return;
    isLoadingGuestbook = true;

    const track = document.getElementById("gb-track");
    if (!track) return;

    track.innerHTML = '<div class="review-loading">Memuat ucapan... 💌</div>';

    const { data, error } = await supabaseGuestbook
        .from("guestbook")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

    isLoadingGuestbook = false;

    if (error || !data || data.length === 0) {
        track.innerHTML = '<div class="review-loading">Belum ada ucapan 💌</div>';
        return;
    }

    // duplikat data biar slider terasa infinite loop
    const doubled = [...data, ...data];

    track.innerHTML = doubled.map(item => `
    <div class="gb-message">
      <div class="gb-message-header">
        <span class="gb-name">${escapeHTML(item.nama)}</span>
        <span class="gb-time">${timeAgo(item.created_at)}</span>
      </div>
      <p class="gb-text">${escapeHTML(item.pesan)}</p>
      <div class="gb-star">✦ ✦ ✦</div>
    </div>
  `).join("");

    // sesuaikan durasi animasi berdasarkan jumlah kartu
    // makin banyak kartu makin lambat biar enak dibaca
    const duration = Math.max(20, data.length * 4);
    track.style.animationDuration = `${duration}s`;
}

// ── SUBMIT ──
async function submitGuestbook(e) {
    e.preventDefault();

    const nameInput = document.getElementById("gb-name");
    const msgInput = document.getElementById("gb-msg");

    const nama = nameInput.value.trim();
    const pesan = msgInput.value.trim();

    if (!nama || !pesan) {
        alert("Nama dan pesan wajib diisi!");
        return;
    }

    const { error } = await supabaseGuestbook
        .from("guestbook")
        .insert([{ nama, pesan }]);

    if (error) {
        alert("Gagal mengirim pesan ❌");
        return;
    }

    nameInput.value = "";
    msgInput.value = "";

    await loadGuestbook();
    alert("Ucapan berhasil dikirim 💌");
}

// ── REALTIME ──
const guestbookChannel = supabaseGuestbook
    .channel('guestbook')
    .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'guestbook'
    }, () => {
        loadGuestbook();
    })
    .subscribe();

// ── INIT ──
document.addEventListener("DOMContentLoaded", () => {
    loadGuestbook();
});


// ── MUSIC ───────────────────────────────────────────
function initMusic() {
    audio = document.getElementById("bg-music");
    if (!audio) return;

    audio.volume = 0.4;

    // auto play setelah klik pertama
    document.body.addEventListener("click", () => {
        if (!playing) {
            audio.play().catch(() => { });
            playing = true;
        }
    }, { once: true });
}

function toggleMusic() {
    if (!audio) return;

    const btn = document.getElementById("music-btn");
    const playIcon = document.getElementById("music-icon-play");
    const pauseIcon = document.getElementById("music-icon-pause");

    if (playing) {
        audio.pause();
        if (playIcon) playIcon.style.display = "block";
        if (pauseIcon) pauseIcon.style.display = "none";
        if (btn) btn.classList.remove("playing");
    } else {
        audio.play().catch(() => { });
        if (playIcon) playIcon.style.display = "none";
        if (pauseIcon) pauseIcon.style.display = "block";
        if (btn) btn.classList.add("playing");
    }

    playing = !playing;
}

// ── QR CODE REAL (pakai library) ────────────────────
function initQR() {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas || typeof QRCode === "undefined") return;

    const data = `UNDANGAN:${guestName}|ACARA:${CONFIG.bride} & ${CONFIG.groom}|TGL:${CONFIG.eventDate}`;

    QRCode.toCanvas(canvas, data, { width: 200 });
}

// ── DOWNLOAD QR ─────────────────────────────────────
function downloadQR() {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `QR-${guestName}.png`;
    link.href = canvas.toDataURL();
    link.click();
}

function initNav() {
    const nav = document.getElementById("nav");
    const hero = document.getElementById("hero");
    if (!nav || !hero) return;

    function checkNav() {
        const heroBottom = hero.getBoundingClientRect().bottom;

        if (heroBottom > 0) {
            // Masih di hero section — sembunyikan navbar
            nav.style.opacity = "0";
            nav.style.pointerEvents = "none";
            nav.style.transform = "translateY(-100%)";
        } else {
            // Sudah lewat hero — tampilkan navbar
            nav.style.opacity = "1";
            nav.style.pointerEvents = "auto";
            nav.style.transform = "translateY(0)";
            nav.classList.add("scrolled");
        }
    }

    window.addEventListener("scroll", checkNav);
    checkNav(); // jalankan sekali saat load

    window.addEventListener("load", () => {
        window.scrollTo(0, 0);
    });
}

function setBnav(el) {
    document.querySelectorAll('.bnav-item')
        .forEach(i => i.classList.remove('active'));
    el.classList.add('active');
}

// Auto-highlight saat scroll
function initBnavScroll() {
    const sections = ['hero', 'countdown', 'events', 'rsvp', 'guestbook'];
    const items = document.querySelectorAll('.bnav-item');

    window.addEventListener('scroll', () => {
        let current = 'hero';

        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const top = el.getBoundingClientRect().top;

                if (top <= 150) {
                    current = id;
                }
            }
        });

        items.forEach(item => {
            const href = item.getAttribute('href').replace('#', '');
            item.classList.toggle('active', href === current);
        });
    });
}

function initAll() {
    initCountdown();
    initScrollReveal();
    initGuestbook();
    initQR();
    initNav();
    initBnavScroll();
}


//  footer navconst bottomNav = document.querySelector('#bottom-nav');
const navItems = document.querySelectorAll('.bnav-item');
const guestbook = document.querySelector('#guestbook');

window.addEventListener('scroll', () => {
    const guestbookTop = guestbook.getBoundingClientRect().top;
    const screenHeight = window.innerHeight;

    // 🚫 kalau sudah masuk guestbook → stop semua animasi nav
    if (guestbookTop < screenHeight * 0.5) {
        navItems.forEach(item => item.classList.remove('active'));
        bottomNav.classList.add('nav-lock'); // kunci state
        return;
    }

    // ✅ normal behavior (sebelum guestbook)
    bottomNav.classList.remove('nav-lock');

    document.querySelectorAll('section').forEach(section => {
        const top = section.offsetTop - 100;
        const bottom = top + section.offsetHeight;
        const scroll = window.scrollY;

        if (scroll >= top && scroll < bottom) {
            navItems.forEach(item => item.classList.remove('active'));
            const active = document.querySelector(`.bnav-item[href="#${section.id}"]`);
            if (active) active.classList.add('active');
        }
    });
});


// Salin No Rekening Bang
function copyText(id) {
    const el = document.getElementById(id);
    if (!el) return;

    const text = el.innerText;

    navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        btn.innerText = "Tersalin ✓";

        setTimeout(() => {
            btn.innerText = "Salin";
        }, 2000);
    });
}