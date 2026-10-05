/* NAV BARU: bangun menu otomatis, scrollspy, offset akurat.
   Muat di paling bawah sebelum </body>, setelah script lama. */
(() => {
  // ====== EDIT DI SINI: id section kamu ======
  // ids   : id section (yang pertama jadi tujuan klik)
  // dock  : true = tampil di menu bawah HP (maks 5)
  const ITEMS = [
    { ids: ['hero'],                label: 'Home',   icon: 'home',  dock: true },
    { ids: ['story'],               label: 'Kisah',  icon: 'heart', dock: true },
    { ids: ['countdown', 'events'], label: 'Acara',  icon: 'cal',   dock: true },
    { ids: ['rsvp'],                label: 'RSVP',   icon: 'mail',  dock: true },
    { ids: ['guestbook'],           label: 'Ucapan', icon: 'msg',   dock: true },
    { ids: ['amplop'],              label: 'Hadiah', icon: 'gift' },
  ];
  const LOGO = 'A & R';
  // ===========================================

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
  };

  // hanya pakai item yang section-nya ada di halaman
  const items = ITEMS.filter(i => i.ids.some(id => document.getElementById(id)));
  if (!items.length) {
    console.warn('[nav.js] Tidak ada section yang cocok. Cek id di ITEMS. Id yang ada:',
      [...document.querySelectorAll('section[id]')].map(s => s.id));
    return;
  }
  const first = i => document.getElementById(i.ids.find(id => document.getElementById(id)));

  // ---- bangun elemen ----
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML =
    `<a class="topbar-logo" href="#${items[0].ids[0]}">${LOGO}</a>
     <ul class="topbar-links">${items.map((i, n) =>
       `<li><a href="#${first(i).id}" data-i="${n}">${i.label}</a></li>`).join('')}</ul>
     <div class="topbar-progress"></div>`;

  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.setAttribute('role', 'navigation');
  dock.setAttribute('aria-label', 'Menu utama');
  dock.innerHTML = items.map((i, n) => i.dock
    ? `<a href="#${first(i).id}" data-i="${n}"><svg viewBox="0 0 24 24">${ICONS[i.icon]}</svg><span>${i.label}</span></a>` : '').join('');

  document.body.append(bar, dock);
  const progress = bar.querySelector('.topbar-progress');
  const links = [...document.querySelectorAll('.topbar-links a, .dock a')];

  // ---- tinggi nav → CSS variable (dipakai scroll-padding) ----
  const isMobile = () => matchMedia('(max-width:640px)').matches;
  const setH = () => document.documentElement.style.setProperty('--nav-h', isMobile() ? '0px' : bar.offsetHeight + 'px');
  setH(); addEventListener('resize', setH);

  // ---- tampilkan setelah cover dibuka ----
  const cover = document.getElementById('cover');
  const main = document.getElementById('main');
  const coverGone = () => {
    if (!cover || !cover.isConnected) return true;
    const cs = getComputedStyle(cover);
    return cover.classList.contains('hidden') || cs.display === 'none' ||
           cs.visibility === 'hidden' || +cs.opacity === 0;
  };
  const sync = () => document.body.classList.toggle('nav-on',
    coverGone() || !!(main && main.classList.contains('visible')));
  sync();
  const mo = new MutationObserver(sync);
  [cover, main].forEach(el => el && mo.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }));
  addEventListener('click', () => setTimeout(sync, 50));
  setInterval(sync, 700);   // jaring pengaman

  // ---- tandai menu aktif ----
  let current = -1, lockUntil = 0;
  const setActive = n => {
    if (n === current) return;
    current = n;
    links.forEach(a => {
      const on = +a.dataset.i === n;
      a.classList.toggle('active', on);
      on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
    });
  };

  // ---- scrollspy + progres ----
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.classList.toggle('scrolled', y > 40);
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      if (Date.now() < lockUntil) return;
      const line = (isMobile() ? 0 : bar.offsetHeight) + innerHeight * 0.3;
      let found = 0;
      items.forEach((it, n) => {
        if (it.ids.some(id => { const el = document.getElementById(id); return el && el.getBoundingClientRect().top <= line; })) found = n;
      });
      if (max > 0 && y >= max - 4) found = items.length - 1;   // paling bawah
      setActive(found);
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);

  // ---- klik menu ----
  links.forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const n = +a.dataset.i, el = first(items[n]);
    lockUntil = Date.now() + 1100;      // cegah menu "loncat-loncat" saat scroll berjalan
    setActive(n);
    if (n === 0) scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(onScroll, 1150);
  }));
  bar.querySelector('.topbar-logo').addEventListener('click', e => {
    e.preventDefault(); lockUntil = Date.now() + 1100; setActive(0);
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  onScroll();
})();
