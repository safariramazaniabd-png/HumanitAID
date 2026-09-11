/* =========================================
   HumanitAID Admin — App Core
   ========================================= */

function escHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(String(str)));
  return div.innerHTML;
}

const App = {
  API_BASE: window.location.port
    ? `${window.location.protocol}//${window.location.hostname}:3000/api`
    : `${window.location.origin}/api`,
  DEMO_MODE: true,
  TOKEN_KEY: 'humanitaid_admin_token',
  THEME_KEY: 'humanitaid_admin_theme',

  pages: {},

  init() {
    this.loadTheme();
    this.setupModal();
    this.setupThemeToggle();
    this.setupSidebar();
    this.setupRouter();
    this.checkAuth();
  },

  // Auth
  async checkAuth() {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      this.showLogin();
      return;
    }

    try {
      const res = await fetch(`${this.API_BASE}/auth/me`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          localStorage.setItem('humanitaid_admin_user', JSON.stringify(data.user));
        }
        this.showAdmin();
      } else {
        this.logout();
      }
    } catch (err) {
      this.showAdmin();
    }
  },

  showLogin() {
    document.getElementById('login-screen').hidden = false;
    document.getElementById('admin-shell').hidden = true;
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.login();
    });
  },

  async login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const btn = document.querySelector('#login-form button[type="submit"]');

    if (!email || !password) {
      errorEl.textContent = 'Email et mot de passe requis';
      errorEl.hidden = false;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Connexion...';

    try {
      const res = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem(this.TOKEN_KEY, data.token);
        if (data.user) {
          localStorage.setItem('humanitaid_admin_user', JSON.stringify(data.user));
        }
        errorEl.hidden = true;
        this.showAdmin();
      } else {
        errorEl.textContent = data.error || 'Identifiants incorrects';
        errorEl.hidden = false;
      }
    } catch (err) {
      errorEl.textContent = 'Erreur de connexion au serveur';
      errorEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  },

  showAdmin() {
    document.getElementById('login-screen').hidden = true;
    document.getElementById('admin-shell').hidden = false;
    this.navigateFromHash();
  },

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    location.hash = '';
    location.reload();
  },

  // API Client
  async api(path, opts = {}) {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const url = `${this.API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(url, { headers, ...opts });
      if (res.status === 401) { this.logout(); return null; }
      return await res.json();
    } catch (err) {
      console.warn('API unreachable, demo mode active');
      return null;
    }
  },

  // Router
  setupRouter() {
    window.addEventListener('hashchange', () => this.navigateFromHash());
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
      });
    });
  },

  navigateFromHash() {
    const hash = location.hash.slice(1) || '/dashboard';
    const page = hash.replace('/', '');
    this.renderPage(page);
  },

  renderPage(page) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) activeNav.classList.add('active');

    const titles = {
      dashboard: 'Tableau de bord',
      publications: 'Publications',
      media: 'Médiathèque',
      slideshows: 'Diaporamas',
      news: 'Actualités',
      testimonials: 'Témoignages',
      causes: 'Causes',
      donations: 'Dons',
      settings: 'Paramètres',
      users: 'Utilisateurs'
    };
    document.getElementById('page-title').textContent = titles[page] || page;

    const container = document.getElementById('page-container');
    if (this.pages[page]) {
      container.innerHTML = '';
      this.pages[page](container);
    } else {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 20L12 4l10 16"/><path d="M6 20h12"/></svg></div><p>Page en cours de développement</p></div>`;
    }
  },

  registerPage(name, fn) {
    this.pages[name] = fn;
  },

  // Modal
  setupModal() {
    document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.closeModal();
    });
  },

  openModal(title, bodyHTML, footerHTML = '', large = false) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    document.getElementById('modal-footer').innerHTML = footerHTML;
    document.getElementById('modal-box').className = large ? 'modal modal-lg' : 'modal';
    overlay.hidden = false;
  },

  closeModal() {
    document.getElementById('modal-overlay').hidden = true;
  },

  confirmModal(title, message, onConfirm) {
    const footer = `
      <button class="btn btn-secondary" onclick="App.closeModal()">Annuler</button>
      <button class="btn btn-danger" id="confirm-action-btn">Confirmer</button>
    `;
    this.openModal(title, `<p>${message}</p>`, footer);
    document.getElementById('confirm-action-btn').addEventListener('click', () => {
      onConfirm();
      this.closeModal();
    });
  },

  // Theme
  loadTheme() {
    const saved = localStorage.getItem(this.THEME_KEY) || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(this.THEME_KEY, next);
    this.updateThemeIcon(next);
  },

  updateThemeIcon(theme) {
    const dark = document.getElementById('theme-icon-dark');
    const light = document.getElementById('theme-icon-light');
    if (dark && light) {
      dark.style.display = theme === 'dark' ? 'block' : 'none';
      light.style.display = theme === 'light' ? 'block' : 'none';
    }
  },

  setupThemeToggle() {
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
  },

  // Sidebar
  setupSidebar() {
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebar-close').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.confirmModal('Déconnexion', 'Voulez-vous vous déconnecter ?', () => this.logout());
    });
  },

  // Helpers
  formatDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatMoney(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  },

  statusBadge(status) {
    const map = {
      published: 'badge-success', active: 'badge-success', paid: 'badge-success', completed: 'badge-success',
      draft: 'badge-muted', inactive: 'badge-muted', pending: 'badge-warning',
      scheduled: 'badge-info', paused: 'badge-warning',
      archived: 'badge-danger', cancelled: 'badge-danger', failed: 'badge-danger'
    };
    const label = { published: 'Publié', active: 'Actif', paid: 'Payé', completed: 'Terminé',
      draft: 'Brouillon', inactive: 'Inactif', pending: 'En attente',
      scheduled: 'Planifié', paused: 'En pause', archived: 'Archivé', cancelled: 'Annulé', failed: 'Échoué' };
    return `<span class="badge ${map[status] || 'badge-muted'}">${label[status] || status}</span>`;
  },

  roleBadge(role) {
    const map = { 'Super Admin': 'badge-danger', Admin: 'badge-warning', Editor: 'badge-info', Finance: 'badge-gold', Viewer: 'badge-muted' };
    return `<span class="badge ${map[role] || 'badge-muted'}">${role}</span>`;
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
