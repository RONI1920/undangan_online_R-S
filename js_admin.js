

// mulai dari si Admin

const BASE_URL = "https://invitationonline.my.id/";

const SUPABASE_URL = "https://cykktrwcbtkcbvgqshiw.supabase.co";
const SUPABASE_KEY_GB = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5a2t0cndjYnRrY2J2Z3FzaGl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODE0NTMsImV4cCI6MjA5MjI1NzQ1M30.ejk0OoR3_fTKF8Lyn86sxklmWyoRkDdGfqP84LUrjwA";

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY_GB);


function generateTemplate(nama, link) {
    return `Kepada Yth.
Bapak/Ibu/Saudara/i
${nama}

Assalamu’alaikum Warahmatullahi Wabarakatuh

Dengan memohon rahmat dan ridha Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Resepsi Pernikahan kami:

Nama:
Rudi Putra & Sri Alva Harional S.Pd

Tanggal:
2 Mei 2026

Waktu:
10:00 - s/d

Tempat:
Mempelai Laki-laki

Untuk informasi detail lokasi, rundown acara, dan undangan digital, silakan klik link berikut:
${link}

Wassalamu’alaikum Warahmatullahi Wabarakatuh

Hormat kami,
Keluarga Besar Kedua Mempelai`;
}

// save

async function saveBulk() {
    const text = document.getElementById("bulkNama").value;

    if (!text.trim()) {
        alert("Isi dulu nama tamu");
        return;
    }

    const list = text.split("\n").map(n => n.trim()).filter(Boolean);

    const data = list.map(nama => ({ nama }));

    const { error } = await sb.from("tamu").insert(data);

    if (error) {
        console.error("INSERT ERROR:", error);
        alert("Gagal simpan data");
        return;
    }

    alert("Berhasil simpan semua tamu!");
    document.getElementById("bulkNama").value = "";
    loadGuests();
}

// load
async function loadGuests() {
    const { data, error } = await sb
        .from("tamu")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById("guestList");

    container.innerHTML = data.map(g => `
        <div style="padding:10px;border-bottom:1px solid #333">
            <b>${g.nama}</b><br>
            <button onclick="generateSingle(${JSON.stringify(g.nama)})">
                Generate WA
            </button>
        </div>
    `).join("");
}

// generate

function generateSingle(nama) {
    const link = `${BASE_URL}?to=${encodeURIComponent(nama)}`;

    const waText = generateTemplate(nama, link);

    window.open(
        `https://wa.me/?text=${encodeURIComponent(waText)}`,
        "_blank"
    );
}


// generate save
async function generateAll() {
    const raw = document.getElementById("listNama").value;

    if (!raw.trim()) {
        alert("Isi dulu nama!");
        return;
    }

    const list = raw.split("\n").map(n => n.trim()).filter(Boolean);

    const output = document.getElementById("output");
    output.innerHTML = "";

    let html = "";

    for (const nama of list) {

        const link = `${BASE_URL}?to=${encodeURIComponent(nama)}`;
        const wa = generateTemplate(nama, link);

        await sb.from("tamu").insert([{
            nama,
            link,
            wa_text: wa
        }]);

        html += `
<div class="item">
    <div class="item-title">${nama}</div>

    <input value="${link}" readonly>
    <button onclick="navigator.clipboard.writeText('${link}')">
        📋 Salin Link
    </button>

    <textarea>${wa}</textarea>

    <button onclick="generateSingle('${nama}')">
        📤 Kirim WA
    </button>
</div>`;
    }

    output.innerHTML = html;
}

// load
async function loadDatabase() {
    const container = document.getElementById("db-output");
    container.innerHTML = "Loading...";

    const { data, error } = await sb
        .from("tamu")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        container.innerHTML = "Gagal load data ❌";
        console.error(error);
        return;
    }

    if (!data.length) {
        container.innerHTML = "Belum ada tamu.";
        return;
    }

    container.innerHTML = data.map(t => `
        <div class="item">
            <div class="item-title">${t.nama}</div>
            <small>${new Date(t.created_at).toLocaleString()}</small>

            <input id="link-${t.id}" value="${t.link}" readonly>
            <button onclick="salinTeks('link-${t.id}', this)">
                📋 Salin Link
            </button>

            <textarea id="wa-${t.id}">${t.wa_text}</textarea>
            <button onclick="salinTeks('wa-${t.id}', this)">
                📋 Salin Pesan WA
            </button>
        </div>
    `).join("");
}

function salinTeks(id, btn) {
    const el = document.getElementById(id);
    const teks = el.value;

    navigator.clipboard.writeText(teks)
        .then(() => {
            const original = btn.textContent;
            btn.textContent = "✅ Tersalin!";
            setTimeout(() => btn.textContent = original, 2000);
        })
        .catch(() => {
            el.select();
            document.execCommand("copy");
            const original = btn.textContent;
            btn.textContent = "✅ Tersalin!";
            setTimeout(() => btn.textContent = original, 2000);
        });
}
// fungsi salin
function salinTeks(id, btn) {
    const teks = document.getElementById(id).value;

    navigator.clipboard.writeText(teks)
        .then(() => {
            btn.textContent = "✅ Tersalin!";
            setTimeout(() => btn.textContent = "📋 Salin Pesan WA", 2000);
        })
        .catch(() => {
            // fallback untuk browser lama
            const el = document.getElementById(id);
            el.select();
            document.execCommand("copy");
            btn.textContent = "✅ Tersalin!";
            setTimeout(() => btn.textContent = "📋 Salin Pesan WA", 2000);
        });
}



async function testKoneksi() {
    console.log("Testing koneksi Supabase...");
    console.log("URL:", SUPABASE_URL);
    console.log("KEY:", SUPABASE_KEY_GB.substring(0, 20) + "...");

    const { data, error } = await sb.from("tamu").select("*").limit(1);

    if (error) {
        console.error("❌ Koneksi gagal:", error.message);
    } else {
        console.log("✅ OK:", data);
    }
}

testKoneksi(); // panggil langsung


function getNamaTamu() {
    const url = window.location.href;

    // ambil parameter ?to=Nama
    const match = url.match(/[?&]to=([^&]+)/);
    if (match) {
        return decodeURIComponent(match[1]);
    }

    return "Bapak/Ibu/Saudara/i";
}

// jalankan setelah halaman siap
document.addEventListener("DOMContentLoaded", function () {
    const nama = getNamaTamu();

    const el = document.getElementById("guest-name");
    if (el) {
        el.textContent = nama;
    }
});

document.addEventListener("DOMContentLoaded", () => {
    console.log("Admin siap");
});

window.onerror = function (msg, url, line) {
    alert(`Error: ${msg} di ${line}`);
};
