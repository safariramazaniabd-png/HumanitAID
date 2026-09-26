/* ═══════════════════════════════════════
   APP.JS — HumanitAID Frontend
   Main application initialization
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  ThemeManager.init();
  DonationForm.init();
  initHamburger();
  initSmoothScroll();
  initFooterYear();

  const hero = new HeroSlideshow();
  const storiesData = await fetchSlides();
  hero.init(storiesData);

  loadStats();
  loadCauses();
  loadCausesGrid();
  loadStoriesCarousel();
  loadPublications();
  loadTestimonials();
  loadNews();
  loadPartners();
  initCitations();
  initFAQ();
  initAnimations();

  document.addEventListener('ha:langchange', () => {
    loadStats();
    loadCauses();
    loadCausesGrid();
    loadPublications();
    loadTestimonials();
    loadNews();
  });
});

/* ── FOOTER YEAR ── */

function initFooterYear() {
  const el = document.getElementById('footer-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ── HAMBURGER MENU ── */

function initHamburger() {
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileOverlay = document.getElementById('mobile-overlay');
  const mobileClose = document.querySelector('.mobile-close');
  if (!hamburger || !mobileMenu) return;

  const focusables = () => Array.from(mobileMenu.querySelectorAll('a, button:not([disabled])'));

  function openMenu() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (mobileOverlay) mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const first = focusables()[0];
    if (first) first.focus();
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (mobileOverlay) mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    if (mobileMenu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMenu);
  if (mobileClose) mobileClose.addEventListener('click', closeMenu);

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && mobileMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* ── SMOOTH SCROLL ── */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ── ANIMATED COUNTERS ── */

function localeNumber() {
  return I18N.lang === 'fr' ? 'fr-FR' : I18N.lang === 'es' ? 'es-ES' : 'en-US';
}

function animateCount(el, target, prefix = '') {
  const dur = 2200;
  const step = 20;
  const increment = target / (dur / step);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = prefix + Math.round(current).toLocaleString(localeNumber());
    if (current >= target) clearInterval(timer);
  }, step);
}

/* ── LOAD STATS ── */

async function loadStats() {
  const stats = await fetchStats();
  applyStat('stat-raised', stats.raised, '$');
  applyStat('stat-donors', stats.donors);
}

function applyStat(id, value, prefix) {
  const el = document.getElementById(id);
  if (!el) return;
  if (typeof value === 'number' && Number.isFinite(value)) {
    el.dataset.count = value;
    if (prefix) el.dataset.prefix = prefix;
    return;
  }
  const item = el.closest('.stat-item');
  if (item) item.style.display = 'none';
}

let causesCache = null;

async function getCauses() {
  if (!causesCache) {
    causesCache = await fetchCauses();
  }
  return causesCache;
}

/* ── LOAD CAUSES (Progress Bars) ── */

async function loadCauses() {
  const causes = await getCauses();
  const grid = document.getElementById('progress-grid');
  if (!grid) return;

  grid.innerHTML = '';
  causes.forEach((cause, i) => {
    const fundable = cause.goal > 0 && cause.collected > 0;
    const pct = fundable ? Math.round((cause.collected / cause.goal) * 100) : 0;
    const fillClass = `bar-fill-${i + 1}`;
    const delay = i % 2 === 1 ? ' fade-up-delay-1' : '';
    const full = i === causes.length - 1 && causes.length % 2 === 1 ? ' progress-card-full' : '';
    const amountsBlock = fundable
      ? `
        <div class="amounts">
          <span class="amount-raised">$${cause.collected.toLocaleString()}</span>
          <span class="amount-goal">${I18N.t('collectes.goal')} : $${cause.goal.toLocaleString()}</span>
        </div>
        <div class="bar-track"><div class="bar-fill ${fillClass}" data-target="${pct}"></div></div>
        <div class="bar-stats">
          <span class="pct">${pct}%</span>
          ${typeof cause.donors === 'number' ? `<span>${I18N.t('causes.donors', { n: cause.donors.toLocaleString(localeNumber()) })}</span>` : ''}
          ${typeof cause.daysLeft === 'number' ? `<span>${cause.daysLeft} ${I18N.t('collectes.daysLeft')}</span>` : ''}
        </div>`
      : '';

    grid.innerHTML += `
      <div class="progress-card fade-up${delay}${full}">
        <div class="card-icon">${humanIcon(cause.icon)}</div>
        <div class="card-title">${cause.title}</div>
        <div class="card-desc">${cause.description}</div>
        ${amountsBlock}
      </div>
    `;
  });

  reInitObserver();
}

/* ── LOAD CAUSES GRID (Visual Cards) ── */

async function loadCausesGrid() {
  const causes = await getCauses();
  const grid = document.getElementById('causes-grid');
  if (!grid) return;

  grid.innerHTML = '';
  causes.forEach((cause, i) => {
    const fundable = cause.goal > 0 && cause.collected > 0;
    const pct = fundable ? Math.round((cause.collected / cause.goal) * 100) : 0;
    const media = cause.image
      ? `<img class="cause-media-img" src="${escHtml(cause.image)}" alt="${escHtml(cause.title)}" loading="lazy">`
      : humanIcon(cause.icon);
    const linkLabel = cause.link || I18N.t('causes.link');
    const amountsBlock = fundable
      ? `
          <div class="amounts">
            <span class="amount-raised">$${cause.collected.toLocaleString()}</span>
            <span class="amount-goal">${I18N.t('collectes.goal')} : $${cause.goal.toLocaleString()}</span>
          </div>
          <div class="bar-track"><div class="bar-fill bar-fill-${i + 1}" data-target="${pct}"></div></div>
          <div class="bar-stats">
            <span class="pct">${pct}%</span>
            ${typeof cause.donors === 'number' ? `<span>${I18N.t('causes.donors', { n: cause.donors.toLocaleString(localeNumber()) })}</span>` : ''}
          </div>`
      : '';

    grid.innerHTML += `
      <article class="cause-card${i === 0 ? ' cause-card--featured' : ''}" data-cause="${escHtml(cause.slug)}">
        <div class="cause-media">
          ${media}
          <span class="cause-index">${String(i + 1).padStart(2, '0')}</span>
          <span class="cause-tag">${I18N.t('causes.priority', { n: i + 1 })}</span>
        </div>
        <div class="cause-body">
          <h3 class="cause-name">${cause.title}</h3>
          <p class="cause-desc">${cause.description}</p>
          ${amountsBlock}
          <a href="#donner" class="cause-link">${linkLabel}</a>
        </div>
      </article>
    `;
  });

  reInitObserver();
}

/* ── LOAD STORIES CAROUSEL ── */

async function loadStoriesCarousel() {
  const track = document.getElementById('stories-track');
  if (!track) return;

  const stories = await fetchFieldStories();
  if (!stories.length) {
    const section = document.getElementById('stories');
    if (section) section.style.display = 'none';
    return;
  }

  track.innerHTML = '';
  stories.forEach((s) => {
    track.innerHTML += `
      <div class="story-card" data-story-id="${escHtml(s.id)}">
        <div class="story-card-inner">
          <div class="story-img">
            ${s.image ? `<img src="${escHtml(s.image)}" alt="${escHtml(s.title)}" loading="lazy">` : humanIcon('document')}
          </div>
          <div class="story-body">
            <p class="story-category">${escHtml(s.category)}</p>
            <h3 class="story-title">${escHtml(s.title)}</h3>
            <p class="story-excerpt">${escHtml(s.excerpt)}</p>
            <p class="story-date">${escHtml(s.date)}</p>
          </div>
        </div>
      </div>
    `;
  });

  const container = document.getElementById('stories-carousel');
  if (container) new Carousel(container);
}

/* ── LOAD PUBLICATIONS ── */

async function loadPublications() {
  const pubs = await fetchPublications();
  const feed = document.getElementById('publications-feed');
  if (!feed) return;
  if (!pubs.length) return;

  feed.innerHTML = '';
  pubs.forEach((p) => {
    const download = p.url
      ? `<a class="pub-download" href="${escHtml(p.url)}" download target="_blank" rel="noopener" aria-label="Télécharger : ${escHtml(p.title)}">${humanIcon('download')}</a>`
      : '';
    feed.innerHTML += `
      <a class="pub-item fade-up" ${p.url ? `href="${escHtml(p.url)}" download target="_blank" rel="noopener"` : ''}>
        <div class="pub-icon">${p.image ? `<img src="${p.image}" alt="" loading="lazy">` : humanIcon(p.icon || 'document')}</div>
        <div class="pub-body">
          <span class="pub-type">${p.type || 'Publication'}</span>
          <h4 class="pub-title">${p.title}</h4>
          <p class="pub-date">${p.date}${p.url ? ' · PDF' : ''}</p>
        </div>
        ${download}
      </a>
    `;
  });
}

/* ── LOAD TESTIMONIALS ── */

async function loadTestimonials() {
  const data = await fetchTestimonials();
  const grid = document.getElementById('temoignages-grid');
  if (!grid) return;
  if (!data.length) return;

  grid.innerHTML = '';
  data.forEach((t, i) => {
    const catClass = 'cat-' + t.category;
    const delays = ['', ' fade-up-delay-1', ' fade-up-delay-2'];
    const delay = delays[i % 3];
    const authorBlock = t.author
      ? `<div class="temoignage-author">
          <div class="author-avatar">${humanIcon(t.avatar)}</div>
          <div>
            <div class="author-name">${t.author}</div>
            <div class="author-loc">${[t.location, t.date].filter(Boolean).join(' · ')}</div>
          </div>
        </div>`
      : '';

    grid.innerHTML += `
      <div class="temoignage-card fade-up${delay}">
        <span class="temoignage-cat ${catClass}">${escHtml(I18N.t('tcat.' + t.category))}</span>
        <p class="temoignage-text">${t.text}</p>
        ${authorBlock}
      </div>
    `;
  });

  reInitObserver();
}

/* ── LOAD NEWS ── */

async function loadNews() {
  const data = await fetchNews();
  const layout = document.getElementById('news-layout');
  if (!layout) return;
  if (!data.length) return;

  const featured = data.find((n) => n.featured) || data[0];
  const sidebar = data.filter((n) => n.id !== featured.id).slice(0, 6);
  const featuredImg = featured.image
    ? `<img class="news-main-img-bg" src="${featured.image}" alt="" loading="lazy">`
    : '';

  layout.innerHTML = `
    <div class="news-main fade-up">
      <div class="news-main-img" style="background: ${featured.gradient || 'linear-gradient(135deg, #1a0808 0%, #5c1a1a 50%, #c0392b 100%)'}">
        ${featuredImg}
        <span style="position:relative;z-index:1">${humanIcon(featured.icon)}</span>
      </div>
      <div class="news-main-body">
        <p class="news-date">${featured.date} · ${featured.category || 'Actualité'}</p>
        <h3 class="news-main-title">${featured.title}</h3>
        <p class="news-main-excerpt">${featured.excerpt || ''}</p>
      </div>
    </div>
    <div class="news-sidebar">
      ${sidebar.map((n) => `
        <div class="news-card fade-up">
          <div class="news-card-icon">${n.image ? `<img src="${n.image}" alt="" loading="lazy">` : humanIcon(n.icon)}</div>
          <div>
            <p class="news-card-date">${n.date}</p>
            <p class="news-card-title">${n.title}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  reInitObserver();
}

/* ── LOAD PARTNERS ── */

async function loadPartners() {
  const data = await fetchPartners();
  const grid = document.getElementById('partners-grid');
  if (!grid) return;
  if (!data.length) {
    const section = grid.closest('section');
    if (section) section.style.display = 'none';
    return;
  }

  grid.innerHTML = '';
  data.forEach((p) => {
    grid.innerHTML += `<div class="partner-item">${p}</div>`;
  });
}

/* ── CITATIONS CAROUSEL ── */

function initCitations() {
  const citations = [
    { text: 'cit.c1.text', author: 'cit.c1.author' },
    { text: 'cit.c2.text', author: 'cit.c2.author' },
    { text: 'cit.c3.text', author: 'cit.c3.author' },
    { text: 'cit.c4.text', author: 'cit.c4.author' },
  ];

  let citIndex = 0;
  const citText = document.getElementById('citation-text');
  const citAuth = document.getElementById('citation-author');
  const citDots = document.querySelectorAll('.citation-dot');

  if (!citText || !citAuth) return;

  function setCitation(i) {
    citText.style.opacity = '0';
    citAuth.style.opacity = '0';
    setTimeout(() => {
      citIndex = i;
      citText.textContent = I18N.t(citations[i].text);
      citAuth.textContent = I18N.t(citations[i].author);
      citText.style.opacity = '1';
      citAuth.style.opacity = '1';
      citDots.forEach((d, j) => {
        d.classList.toggle('active', j === i);
        d.setAttribute('aria-label', I18N.t('cit.dot', { n: j + 1 }));
      });
    }, 400);
  }

  citDots.forEach((d, i) => d.addEventListener('click', () => setCitation(i)));
  setInterval(() => setCitation((citIndex + 1) % citations.length), 6000);
  document.addEventListener('ha:langchange', () => setCitation(citIndex));
}

/* ── FAQ ACCORDION ── */

function initFAQ() {
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));

      if (!wasOpen) {
        item.classList.add('open');
      }
    });
  });
}

/* ── INTERSECTION OBSERVER (ANIMATIONS) ── */

let fadeObserver;
let barObserver;
let countObserver;

function initAnimations() {
  fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.15 }
  );

  barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const fill = e.target;
          const target = fill.dataset.target;
          setTimeout(() => {
            fill.style.width = target + '%';
          }, 200);
          barObserver.unobserve(fill);
        }
      });
    },
    { threshold: 0.3 }
  );

  countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const el = e.target;
          animateCount(el, parseInt(el.dataset.count, 10), el.dataset.prefix || '');
          countObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );

  reInitObserver();
}

function reInitObserver() {
  if (fadeObserver) {
    document.querySelectorAll('.fade-up:not(.visible)').forEach((el) => fadeObserver.observe(el));
  }
  if (barObserver) {
    document.querySelectorAll('.bar-fill').forEach((b) => barObserver.observe(b));
  }
  if (countObserver) {
    document.querySelectorAll('[data-count]').forEach((el) => countObserver.observe(el));
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if (location.protocol !== 'https:' && !isLocal) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

registerServiceWorker();
