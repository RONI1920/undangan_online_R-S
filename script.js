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
    const guestParam = urlParams.get("to") || urlParams.get("nama") || guestName;

    guestName = decodeURIComponent(guestParam)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const guestEl = document.getElementById("guest-name");
    const qrGuestEl = document.getElementById("qr-guest-display");

    if (guestEl) guestEl.textContent = guestName;
    if (qrGuestEl) qrGuestEl.textContent = guestName;
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

    if (cover) cover.classList.add("hidden");
    if (main) main.classList.add("visible");

    setTimeout(() => {
        if (cover) cover.style.display = "none";
        initAll();
    }, 800);
}

function initAll() {
    initCountdown();
    initScrollReveal();
    initGuestbook();
    initQR();
    initNav();
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

// ── NAV ─────────────────────────────────────────────
function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;

    window.addEventListener("scroll", () => {
        nav.classList.toggle("scrolled", window.scrollY > 60);
    });
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

function submitGuestbook(e) {
    e.preventDefault();

    const name = document.getElementById("gb-name").value.trim();
    const msg = document.getElementById("gb-msg").value.trim();

    if (!name || !msg) return;

    messages.unshift({ name, msg, time: "Baru saja" });
    renderMessages();
    e.target.reset();
}

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
}