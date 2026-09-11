/* ═══════════════════════════════════════
   CAROUSEL — HumanitAID
   Generic slideshow with touch/keyboard support
   ═══════════════════════════════════════ */

class Carousel {
  constructor(container, options = {}) {
    this.container = container;
    this.track = container.querySelector('.stories-track');
    this.cards = container.querySelectorAll('.story-card');
    this.prevBtn = container.querySelector('.carousel-prev');
    this.nextBtn = container.querySelector('.carousel-next');
    this.dotsContainer = container.querySelector('.carousel-dots');

    this.currentIndex = 0;
    this.autoInterval = null;
    this.autoDelay = options.autoDelay || 5500;
    this.paused = false;

    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    if (!this.track || this.cards.length === 0) return;

    this.createDots();
    this.bindEvents();
    this.update();

    if (!this.prefersReducedMotion) {
      this.startAuto();
    }
  }

  createDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';
    const count = Math.ceil(this.cards.length / this.getVisibleCount());
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Diapositive ${i + 1}`);
      dot.addEventListener('click', () => this.goTo(i));
      this.dotsContainer.appendChild(dot);
    }
    this.dots = this.dotsContainer.querySelectorAll('.carousel-dot');
  }

  getVisibleCount() {
    const w = window.innerWidth;
    if (w <= 480) return 1;
    if (w <= 768) return 2;
    if (w <= 1024) return 3;
    return 4;
  }

  update() {
    const visible = this.getVisibleCount();
    const cardWidth = this.cards[0].offsetWidth;
    const offset = this.currentIndex * cardWidth * visible;
    this.track.style.transform = `translateX(-${offset}px)`;

    if (this.dots) {
      this.dots.forEach((d, i) => d.classList.toggle('active', i === this.currentIndex));
    }
  }

  goTo(index) {
    const maxIndex = Math.max(0, Math.ceil(this.cards.length / this.getVisibleCount()) - 1);
    this.currentIndex = Math.max(0, Math.min(index, maxIndex));
    this.update();
  }

  next() {
    const maxIndex = Math.max(0, Math.ceil(this.cards.length / this.getVisibleCount()) - 1);
    this.goTo(this.currentIndex >= maxIndex ? 0 : this.currentIndex + 1);
  }

  prev() {
    const maxIndex = Math.max(0, Math.ceil(this.cards.length / this.getVisibleCount()) - 1);
    this.goTo(this.currentIndex <= 0 ? maxIndex : this.currentIndex - 1);
  }

  startAuto() {
    this.stopAuto();
    this.autoInterval = setInterval(() => {
      if (!this.paused) this.next();
    }, this.autoDelay);
  }

  stopAuto() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
  }

  bindEvents() {
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => {
      this.prev();
      if (!this.prefersReducedMotion) this.startAuto();
    });

    if (this.nextBtn) this.nextBtn.addEventListener('click', () => {
      this.next();
      if (!this.prefersReducedMotion) this.startAuto();
    });

    this.container.addEventListener('mouseenter', () => {
      this.paused = true;
    });

    this.container.addEventListener('mouseleave', () => {
      this.paused = false;
    });

    this.container.addEventListener('focusin', () => { this.paused = true; });
    this.container.addEventListener('focusout', () => { this.paused = false; });

    document.addEventListener('keydown', (e) => {
      if (!this.container.matches(':hover')) return;
      if (e.key === 'ArrowLeft') { this.prev(); this.startAuto(); }
      if (e.key === 'ArrowRight') { this.next(); this.startAuto(); }
    });

    let touchStartX = 0;
    this.track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    this.track.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? this.next() : this.prev();
        if (!this.prefersReducedMotion) this.startAuto();
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      this.createDots();
      this.update();
    });
  }

  destroy() {
    this.stopAuto();
  }
}

/* ═══════════════════════════════════════
   HERO SLIDESHOW (separate from generic carousel)
   ═══════════════════════════════════════ */

class HeroSlideshow {
  constructor() {
    this.currentIndex = 0;
    this.slides = [];
    this.timer = null;
    this.autoDelay = 5500;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.els = {
      container: document.getElementById('hero-slides'),
      title: document.getElementById('hero-title'),
      caption: document.getElementById('hero-caption'),
      badge: document.querySelector('.hero-badge'),
      counter: document.getElementById('slide-current'),
      dotsContainer: document.getElementById('hero-dots'),
    };
  }

  init(slides) {
    this.slides = slides;
    if (!this.els.container || slides.length === 0) return;

    this.buildSlides();
    this.buildDots();
    this.goTo(0);

    if (!this.prefersReducedMotion) {
      this.startAuto();
    }
  }

  buildSlides() {
    this.els.container.innerHTML = '';
    this.slides.forEach((slide, i) => {
      const div = document.createElement('div');
      div.className = `hero-slide ${slide.gradient || 'slide-' + (i + 1)}${i === 0 ? ' active' : ''}`;
      div.setAttribute('aria-hidden', i !== 0 ? 'true' : 'false');
      if (slide.image) {
        div.style.backgroundImage = `url('${slide.image}')`;
        div.style.backgroundSize = 'cover';
        div.style.backgroundPosition = 'center';
      }
      div.innerHTML = `<div class="slide-visual" aria-hidden="true">${slide.icon ? humanIcon(slide.icon) : ''}</div>`;
      this.els.container.appendChild(div);
    });
    this.slideEls = this.els.container.querySelectorAll('.hero-slide');
  }

  buildDots() {
    if (!this.els.dotsContainer) return;
    this.els.dotsContainer.innerHTML = '';
    this.slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Diapositive ${i + 1}`);
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.startAuto();
      });
      this.els.dotsContainer.appendChild(dot);
    });
    this.dotEls = this.els.dotsContainer.querySelectorAll('.hero-dot');
  }

  goTo(index) {
    if (this.slideEls) {
      this.slideEls.forEach((s, i) => {
        s.classList.toggle('active', i === index);
        s.setAttribute('aria-hidden', i !== index ? 'true' : 'false');
      });
    }
    if (this.dotEls) {
      this.dotEls.forEach((d, i) => d.classList.toggle('active', i === index));
    }

    this.currentIndex = index;
    const slide = this.slides[index];

    if (this.els.title) this.els.title.innerHTML = slide.title;
    if (this.els.caption) this.els.caption.textContent = slide.caption;
    if (this.els.badge && slide.badge) this.els.badge.textContent = slide.badge;
    if (this.els.counter) this.els.counter.textContent = index + 1;
  }

  next() {
    this.goTo((this.currentIndex + 1) % this.slides.length);
  }

  startAuto() {
    this.stopAuto();
    this.timer = setInterval(() => this.next(), this.autoDelay);
  }

  stopAuto() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
