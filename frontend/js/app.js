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

  function openMenu() {
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (mobileOverlay) mobileOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (mobileOverlay) mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';
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

function animateCount(el, target, prefix = '') {
  const dur = 2200;
  const step = 20;
  const increment = target / (dur / step);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + increment, target);
    el.textContent = prefix + Math.round(current).toLocaleString('fr-FR');
    if (current >= target) clearInterval(timer);
  }, step);
}

/* ── LOAD STATS ── */

async function loadStats() {
  const stats = await fetchStats();
  const displaced = document.getElementById('stat-displaced');
  const orphans = document.getElementById('stat-orphans');
  const raised = document.getElementById('stat-raised');
  const donors = document.getElementById('stat-donors');

  if (displaced) displaced.dataset.count = stats.displaced;
  if (orphans) orphans.dataset.count = stats.orphans;
  if (raised) { raised.dataset.count = stats.raised; raised.dataset.prefix = '$'; }
  if (donors) donors.dataset.count = stats.donors;
}

/* ── LOAD CAUSES (Progress Bars) ── */

async function loadCauses() {
  const causes = await fetchCauses();
  const grid = document.getElementById('progress-grid');
  if (!grid) return;

  grid.innerHTML = '';
  causes.forEach((cause, i) => {
    const pct = Math.round((cause.collected / cause.goal) * 100);
    const fillClass = `bar-fill-${i + 1}`;
    const delay = i % 2 === 1 ? ' fade-up-delay-1' : '';
    const full = i === causes.length - 1 && causes.length % 2 === 1 ? ' progress-card-full' : '';

    grid.innerHTML += `
      <div class="progress-card fade-up${delay}${full}">
        <div class="card-icon">${humanIcon(cause.icon)}</div>
        <div class="card-title">${cause.title}</div>
        <div class="card-desc">${cause.description}</div>
        <div class="amounts">
          <span class="amount-raised">$${cause.collected.toLocaleString()}</span>
          <span class="amount-goal">Objectif : $${cause.goal.toLocaleString()}</span>
        </div>
        <div class="bar-track"><div class="bar-fill ${fillClass}" data-target="${pct}"></div></div>
        <div class="bar-stats">
          <span class="pct">${pct}%</span>
          <span>${(cause.donors || 0).toLocaleString()} donateurs</span>
          <span>${(cause.daysLeft || 0)} jours restants</span>
        </div>
      </div>
    `;
  });

  reInitObserver();
}

/* ── LOAD CAUSES GRID (Visual Cards) ── */

async function loadCausesGrid() {
  const causes = await fetchCauses();
  const grid = document.getElementById('causes-grid');
  if (!grid) return;

  grid.innerHTML = '';
  causes.forEach((cause) => {
    const bgStyle = cause.image
      ? `style="background-image:linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.15)), url('${cause.image}')"`
      : '';
    grid.innerHTML += `
      <div class="cause-card">
        <div class="cause-bg ${cause.bgClass}" ${bgStyle}>
          <div class="cause-emoji" aria-hidden="true">${humanIcon(cause.icon)}</div>
        </div>
        <div class="cause-overlay">
          <span class="cause-tag">${cause.priority}</span>
          <div class="cause-name">${cause.title}</div>
          <div class="cause-desc">${cause.detail}</div>
          <a href="#donner" class="cause-link">${cause.link}</a>
        </div>
      </div>
    `;
  });
}

/* ── LOAD STORIES CAROUSEL ── */

async function loadStoriesCarousel() {
  const data = await fetchSlides();
  const track = document.getElementById('stories-track');
  if (!track) return;

  const stories = [
    { title: 'Le camp de Bulengo déborde — 12 000 personnes sans abri', category: 'Déplacement', icon: 'tent', image: '/assets/images/305274.HR_.jpg', excerpt: 'Les nouvelles arrivées de déplacés du Nord-Kivu affluxent chaque jour. Les conditions sanitaires se détériorent.', date: 'Avril 2025' },
    { title: 'Grâce retrouve l\'espoir grâce à l\'éducation', category: 'Éducation', icon: 'education', image: '/assets/images/eedddb3cfc96d84d68876a35a0389d52.jpg', excerpt: 'Une école de fortune a été créée dans le camp. 200 enfants fréquentent chaque jour malgré tout.', date: 'Mars 2025' },
    { title: 'Centre médical mobile opère en zone hostile', category: 'Santé', icon: 'medical', image: '/assets/images/4c8a870b8cb8ef771a49d2292ec067e9.jpg', excerpt: 'Notre équipe mobile a réalisé 1 200 consultations en 2 semaines dans des zones inaccessibles.', date: 'Mars 2025' },
    { title: 'Distribution d\'eau potable — 8 000 personnes servies', category: 'Eau & Hygiène', icon: 'water', image: '/assets/images/ad8214043dacc9fdd2db955958838b0b.jpg', excerpt: 'Des réservoirs d\'eau ont été installés dans 3 camps du Sud-Kivu, réduisant les maladies hydriques.', date: 'Février 2025' },
    { title: '320 fauteuils roulants distribués aux handicapés de guerre', category: 'Inclusion', icon: 'wheelchair', image: '/assets/images/MSB160469.jpg', excerpt: 'Chaque fauteuil est adapté individuellement. La mobilité redonne la dignité et l\'autonomie.', date: 'Février 2025' },
  ];

  track.innerHTML = '';
  stories.forEach((s) => {
    track.innerHTML += `
      <div class="story-card">
        <div class="story-card-inner">
          <div class="story-img">
            ${s.image ? `<img src="${s.image}" alt="${escHtml(s.title)}" loading="lazy">` : humanIcon(s.icon)}
          </div>
          <div class="story-body">
            <p class="story-category">${s.category}</p>
            <h3 class="story-title">${s.title}</h3>
            <p class="story-excerpt">${s.excerpt}</p>
            <p class="story-date">${s.date}</p>
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

  grid.innerHTML = '';
  data.forEach((t, i) => {
    const catClass = 'cat-' + t.category;
    const delays = ['', ' fade-up-delay-1', ' fade-up-delay-2'];
    const delay = delays[i % 3];

    grid.innerHTML += `
      <div class="temoignage-card fade-up${delay}">
        <span class="temoignage-cat ${catClass}">${t.categoryLabel}</span>
        <p class="temoignage-text">${t.text}</p>
        <div class="temoignage-author">
          <div class="author-avatar">${humanIcon(t.avatar)}</div>
          <div>
            <div class="author-name">${t.author}</div>
            <div class="author-loc">${t.location} · ${t.date}</div>
          </div>
        </div>
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

  grid.innerHTML = '';
  data.forEach((p) => {
    grid.innerHTML += `<div class="partner-item">${p}</div>`;
  });
}

/* ── CITATIONS CAROUSEL ── */

function initCitations() {
  const citations = [
    { text: '« Injustice anywhere is a threat to justice everywhere. »', author: '— Martin Luther King Jr.' },
    { text: '« Si vous ne pouvez pas nourrir cent personnes, nourrissez-en une seule. »', author: '— Mère Teresa' },
    { text: '« La vie d\'un seul homme vaut autant que celle de toute l\'humanité. »', author: '— Albert Einstein' },
    { text: '« Un enfant, un enseignant, un livre, un stylo peuvent changer le monde. »', author: '— Malala Yousafzai' },
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
      citText.textContent = citations[i].text;
      citAuth.textContent = citations[i].author;
      citText.style.opacity = '1';
      citAuth.style.opacity = '1';
      citDots.forEach((d, j) => d.classList.toggle('active', j === i));
    }, 400);
  }

  citDots.forEach((d, i) => d.addEventListener('click', () => setCitation(i)));
  setInterval(() => setCitation((citIndex + 1) % citations.length), 6000);
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
  if ('serviceWorker' in navigator && location.protocol !== 'http:') return;
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

registerServiceWorker();
