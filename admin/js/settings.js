/* =========================================
   HumanitAID Admin — Settings
   Branché sur l'API réelle /api/settings.
   ========================================= */

(function () {
  let settings = {};
  let loadError = false;

  const DEFAULTS = {
    site_name: '',
    site_tagline: '',
    site_url: '',
    language: 'fr',
    currency: 'USD',
    theme: 'dark',
    contact_email: '',
    contact_phone: '',
    donation_goal_default: '500000',
    enable_newsletter: 'true',
    enable_testimonials: 'true',
    ticker_speed: '30',
    hero_slideshow_interval: '5500',
    footer_text: '',
  };

  const SECTIONS = {
    general: [
      'site_name',
      'site_tagline',
      'site_url',
      'language',
      'currency',
    ],
    contact: [
      'contact_email',
      'contact_phone',
    ],
    appearance: [
      'theme',
      'ticker_speed',
      'hero_slideshow_interval',
    ],
    features: [
      'enable_newsletter',
      'enable_testimonials',
    ],
    donations: [
      'donation_goal_default',
    ],
    footer: [
      'footer_text',
    ],
  };

  function escapeValue(value) {
    return escHtml(value == null ? '' : value);
  }

  function normalizeSettings(data) {
    const source = data && data.settings ? data.settings : {};
    return { ...DEFAULTS, ...source };
  }

  async function loadSettings(container) {
    loadError = false;
    container.innerHTML = `
      <div class="section-header">
        <h2>Paramètres</h2>
      </div>
      <p class="text-muted">Chargement…</p>
    `;

    const data = await App.api('/settings');

    if (!data || data.error || !data.settings) {
      loadError = true;
      render(container);
      return;
    }

    settings = normalizeSettings(data);
    render(container);
  }

  function render(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header">
          <h2>Paramètres</h2>
        </div>
        <p class="text-muted">
          Impossible de charger les paramètres depuis le serveur.
          Vérifiez la connexion à l'API.
        </p>
        <button class="btn btn-secondary" id="retry-settings">
          Réessayer
        </button>
      `;

      document
        .getElementById('retry-settings')
        .addEventListener('click', () => loadSettings(container));

      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <h2>Paramètres</h2>
      </div>

      <div class="settings-grid">

        <!-- Général -->
        <div class="form-section">
          <div class="form-section-title">Général</div>

          <div class="form-group">
            <label>Nom du site</label>
            <input type="text" id="s-name" value="${escapeValue(settings.site_name)}">
          </div>

          <div class="form-group">
            <label>Slogan</label>
            <input type="text" id="s-tagline" value="${escapeValue(settings.site_tagline)}">
          </div>

          <div class="form-group">
            <label>URL principale</label>
            <input type="url" id="s-url" value="${escapeValue(settings.site_url)}">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Langue par défaut</label>
              <select id="s-language">
                <option value="fr" ${settings.language === 'fr' ? 'selected' : ''}>Français</option>
                <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Español</option>
              </select>
            </div>

            <div class="form-group">
              <label>Devise des dons</label>
              <select id="s-currency">
                <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD</option>
                <option value="CDF" ${settings.currency === 'CDF' ? 'selected' : ''}>CDF</option>
              </select>
            </div>
          </div>

          <p class="text-sm text-muted" id="settings-general-error" hidden></p>

          <button class="btn btn-primary btn-sm save-section" data-section="general">
            Enregistrer
          </button>
        </div>

        <!-- Contact -->
        <div class="form-section">
          <div class="form-section-title">Contact</div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" id="s-email" value="${escapeValue(settings.contact_email)}">
          </div>

          <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" id="s-phone" value="${escapeValue(settings.contact_phone)}">
          </div>

          <p class="text-sm text-muted" id="settings-contact-error" hidden></p>

          <button class="btn btn-primary btn-sm save-section" data-section="contact">
            Enregistrer
          </button>
        </div>

        <!-- Apparence -->
        <div class="form-section">
          <div class="form-section-title">Apparence</div>

          <div class="form-group">
            <label>Thème du site</label>
            <select id="s-theme">
              <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Sombre</option>
              <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Clair</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Vitesse du ticker (secondes)</label>
              <input
                type="number"
                id="s-ticker"
                min="1"
                value="${escapeValue(settings.ticker_speed)}"
              >
            </div>

            <div class="form-group">
              <label>Intervalle slideshow (ms)</label>
              <input
                type="number"
                id="s-slideshow"
                min="1000"
                value="${escapeValue(settings.hero_slideshow_interval)}"
              >
            </div>
          </div>

          <p class="text-sm text-muted" id="settings-appearance-error" hidden></p>

          <button class="btn btn-primary btn-sm save-section" data-section="appearance">
            Enregistrer
          </button>
        </div>

        <!-- Fonctionnalités -->
        <div class="form-section">
          <div class="form-section-title">Fonctionnalités</div>

          <div class="form-check">
            <input
              type="checkbox"
              id="s-newsletter"
              ${String(settings.enable_newsletter) === 'true' ? 'checked' : ''}
            >
            <label for="s-newsletter">Activer la newsletter</label>
          </div>

          <div class="form-check">
            <input
              type="checkbox"
              id="s-testimonials"
              ${String(settings.enable_testimonials) === 'true' ? 'checked' : ''}
            >
            <label for="s-testimonials">Afficher les témoignages</label>
          </div>

          <p class="text-sm text-muted" id="settings-features-error" hidden></p>

          <button class="btn btn-primary btn-sm save-section" data-section="features">
            Enregistrer
          </button>
        </div>

        <!-- Dons -->
        <div class="form-section">
          <div class="form-section-title">Dons</div>

          <div class="form-group">
            <label>Objectif de collecte par défaut</label>
            <input
              type="number"
              id="s-donation-goal"
              min="0"
              step="1"
              value="${escapeValue(settings.donation_goal_default)}"
            >
          </div>

          <p class="text-sm text-muted" id="settings-donations-error" hidden></p>

          <button class="btn btn-primary btn-sm save-section" data-section="donations">
            Enregistrer
          </button>
        </div>

        <!-- Pied de page -->
        <div class="form-section">
          <div class="form-section-title">Pied de page</div>

          <div class="form-group">
            <label>Texte du pied de page</label>
            <textarea id="s-footer" rows="3">${escapeValue(settings.footer_text)}</textarea>
          </div>

          <p class="text-sm text-muted" id="settings-footer-error" hidden></p>

          <button class="btn btn-primary btn-sm save-section" data-section="footer">
            Enregistrer
          </button>
        </div>

      </div>
    `;

    container.querySelectorAll('.save-section').forEach((btn) => {
      btn.addEventListener('click', () => saveSection(container, btn));
    });
  }

  function collectSection(section) {
    if (section === 'general') {
      return {
        site_name: document.getElementById('s-name').value.trim(),
        site_tagline: document.getElementById('s-tagline').value.trim(),
        site_url: document.getElementById('s-url').value.trim(),
        language: document.getElementById('s-language').value,
        currency: document.getElementById('s-currency').value,
      };
    }

    if (section === 'contact') {
      return {
        contact_email: document.getElementById('s-email').value.trim(),
        contact_phone: document.getElementById('s-phone').value.trim(),
      };
    }

    if (section === 'appearance') {
      return {
        theme: document.getElementById('s-theme').value,
        ticker_speed: document.getElementById('s-ticker').value,
        hero_slideshow_interval: document.getElementById('s-slideshow').value,
      };
    }

    if (section === 'features') {
      return {
        enable_newsletter: document.getElementById('s-newsletter').checked ? 'true' : 'false',
        enable_testimonials: document.getElementById('s-testimonials').checked ? 'true' : 'false',
      };
    }

    if (section === 'donations') {
      return {
        donation_goal_default: document.getElementById('s-donation-goal').value,
      };
    }

    if (section === 'footer') {
      return {
        footer_text: document.getElementById('s-footer').value.trim(),
      };
    }

    return {};
  }

  async function saveSection(container, btn) {
    const section = btn.dataset.section;
    const values = collectSection(section);
    const errorEl = document.getElementById(`settings-${section}-error`);

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = '';
    }

    if (section === 'general' && !values.site_name) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = 'Le nom du site est requis.';
      }
      return;
    }

    if (section === 'general' && values.site_url) {
      try {
        new URL(values.site_url);
      } catch (_err) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = 'L’URL du site est invalide.';
        }
        return;
      }
    }

    if (section === 'contact' && values.contact_email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email)) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = 'L’adresse email est invalide.';
        }
        return;
      }
    }

    if (section === 'appearance') {
      const ticker = Number(values.ticker_speed);
      const slideshow = Number(values.hero_slideshow_interval);

      if (!Number.isFinite(ticker) || ticker < 1) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = 'La vitesse du ticker doit être supérieure ou égale à 1 seconde.';
        }
        return;
      }

      if (!Number.isFinite(slideshow) || slideshow < 1000) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = 'L’intervalle du slideshow doit être d’au moins 1000 ms.';
        }
        return;
      }
    }

    if (section === 'donations') {
      const goal = Number(values.donation_goal_default);

      if (!Number.isFinite(goal) || goal < 0) {
        if (errorEl) {
          errorEl.hidden = false;
          errorEl.textContent = 'L’objectif de collecte doit être un nombre positif ou nul.';
        }
        return;
      }
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Enregistrement…';

    try {
      for (const key of SECTIONS[section] || []) {
        const res = await App.api('/settings', {
          method: 'PUT',
          body: JSON.stringify({
            key,
            value: values[key],
          }),
        });

        if (!res || res.error || !res.setting) {
          throw new Error(
            (res && res.error) || `Échec de l’enregistrement de ${key}.`
          );
        }

        settings[key] = res.setting.value;
      }

      btn.textContent = '✓ Enregistré';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-success');

      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('btn-success');
        btn.classList.add('btn-primary');
      }, 1500);
    } catch (err) {
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = err.message || 'Erreur de connexion au serveur.';
      }

      btn.textContent = originalText;
    } finally {
      btn.disabled = false;
    }
  }

  App.registerPage('settings', async function (container) {
    await loadSettings(container);
  });
})();
