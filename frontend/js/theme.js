/* ═══════════════════════════════════════
   THEME MANAGEMENT — HumanitAID
   Light / Dark / System
   ═══════════════════════════════════════ */

const ThemeManager = {
  STORAGE_KEY: 'humanitaid-theme',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      this.apply(saved);
    } else {
      this.apply('system');
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.updateActiveButton();
      if (this.getCurrentTheme() === 'system') {
        this.applySystem();
      }
    });

    this.bindSwitcher();
    this.updateActiveButton();
  },

  getCurrentTheme() {
    return localStorage.getItem(this.STORAGE_KEY) || 'system';
  },

  apply(theme) {
    if (theme === 'system') {
      this.applySystem();
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    this.updateActiveButton();
  },

  applySystem() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  },

  setTheme(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.apply(theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  },

  updateActiveButton() {
    const current = this.getCurrentTheme();
    document.querySelectorAll('.theme-btn').forEach(btn => {
      const isActive = btn.dataset.themeValue === current;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  },

  bindSwitcher() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-btn');
      if (btn && btn.dataset.themeValue) {
        this.setTheme(btn.dataset.themeValue);
      }
    });
  },
};

/* Prevent flash: run synchronously before paint */
(function () {
  const saved = localStorage.getItem('humanitaid-theme');
  if (saved) {
    if (saved === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', saved);
    }
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  }
})();
