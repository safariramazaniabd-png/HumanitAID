/* =========================================
   HumanitAID Admin — Settings
   ========================================= */

(function () {
  let settings = {
    general: { site_name: 'HumanitAID Foundation', tagline: 'Ensemble pour la RDC', language: 'fr' },
    appearance: { theme: 'dark', visitor_theme: 'dark' },
    seo: { meta_title: 'HumanitAID — Aide humanitaire en RDC', meta_description: 'HumanitAID Foundation lutte contre la crise humanitaire en République Démocratique du Congo.', og_image: '' },
    contact: { email: 'contact@humanitaid.org', phone: '+243 81 234 5678', address: 'Avenue Lumumba, 45 — Goma, Nord-Kivu, RDC' },
    social: { facebook: 'https://facebook.com/humanitaid', twitter: 'https://x.com/humanitaid', instagram: 'https://instagram.com/humanitaid', whatsapp: '+243812345678' },
    payment: { stripe_key: 'pk_test_••••••••••••••••', provider: 'stripe' }
  };

  function render(container) {
    container.innerHTML = `
      <div class="section-header">
        <h2>Paramètres <span class="demo-badge">DEMO</span></h2>
      </div>
      <div class="settings-grid">

        <!-- General -->
        <div class="form-section">
          <div class="form-section-title">Général</div>
          <div class="form-group"><label>Nom du site</label><input type="text" id="s-name" value="${settings.general.site_name}"></div>
          <div class="form-group"><label>Slogan</label><input type="text" id="s-tagline" value="${settings.general.tagline}"></div>
          <div class="form-group">
            <label>Langue</label>
            <select id="s-lang">
              <option value="fr" ${settings.general.language === 'fr' ? 'selected' : ''}>Français</option>
              <option value="en" ${settings.general.language === 'en' ? 'selected' : ''}>English</option>
              <option value="sw" ${settings.general.language === 'sw' ? 'selected' : ''}>Kiswahili</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm save-section" data-section="general">Enregistrer</button>
        </div>

        <!-- Appearance -->
        <div class="form-section">
          <div class="form-section-title">Apparence</div>
          <div class="form-row">
            <div class="form-group">
              <label>Thème de l'admin</label>
              <select id="s-theme">
                <option value="dark" ${settings.appearance.theme === 'dark' ? 'selected' : ''}>Sombre</option>
                <option value="light" ${settings.appearance.theme === 'light' ? 'selected' : ''}>Clair</option>
                <option value="system" ${settings.appearance.theme === 'system' ? 'selected' : ''}>Système</option>
              </select>
            </div>
            <div class="form-group">
              <label>Thème par défaut pour les visiteurs</label>
              <select id="s-visitor-theme">
                <option value="dark" ${settings.appearance.visitor_theme === 'dark' ? 'selected' : ''}>Sombre</option>
                <option value="light" ${settings.appearance.visitor_theme === 'light' ? 'selected' : ''}>Clair</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm save-section" data-section="appearance">Enregistrer</button>
        </div>

        <!-- SEO -->
        <div class="form-section">
          <div class="form-section-title">SEO</div>
          <div class="form-group"><label>Titre meta</label><input type="text" id="s-seo-title" value="${settings.seo.meta_title}"></div>
          <div class="form-group"><label>Description meta</label><textarea id="s-seo-desc" rows="2">${settings.seo.meta_description}</textarea></div>
          <div class="form-group"><label>Image Open Graph (URL)</label><input type="url" id="s-og-image" value="${settings.seo.og_image}" placeholder="https://..."></div>
          <button class="btn btn-primary btn-sm save-section" data-section="seo">Enregistrer</button>
        </div>

        <!-- Contact -->
        <div class="form-section">
          <div class="form-section-title">Contact</div>
          <div class="form-row">
            <div class="form-group"><label>Email</label><input type="email" id="s-email" value="${settings.contact.email}"></div>
            <div class="form-group"><label>Téléphone</label><input type="tel" id="s-phone" value="${settings.contact.phone}"></div>
          </div>
          <div class="form-group"><label>Adresse</label><input type="text" id="s-address" value="${settings.contact.address}"></div>
          <button class="btn btn-primary btn-sm save-section" data-section="contact">Enregistrer</button>
        </div>

        <!-- Social -->
        <div class="form-section">
          <div class="form-section-title">Réseaux sociaux</div>
          <div class="form-row">
            <div class="form-group"><label>Facebook</label><input type="url" id="s-facebook" value="${settings.social.facebook}"></div>
            <div class="form-group"><label>Twitter / X</label><input type="url" id="s-twitter" value="${settings.social.twitter}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Instagram</label><input type="url" id="s-instagram" value="${settings.social.instagram}"></div>
            <div class="form-group"><label>WhatsApp</label><input type="tel" id="s-whatsapp" value="${settings.social.whatsapp}"></div>
          </div>
          <button class="btn btn-primary btn-sm save-section" data-section="social">Enregistrer</button>
        </div>

        <!-- Payment -->
        <div class="form-section">
          <div class="form-section-title">Paiement</div>
          <div class="form-row">
            <div class="form-group"><label>Clé publique Stripe</label><input type="text" id="s-stripe" value="${settings.payment.stripe_key}"></div>
            <div class="form-group">
              <label>Fournisseur de paiement</label>
              <select id="s-provider">
                <option value="stripe" ${settings.payment.provider === 'stripe' ? 'selected' : ''}>Stripe</option>
                <option value="paypal" ${settings.payment.provider === 'paypal' ? 'selected' : ''}>PayPal</option>
                <option value="flutterwave" ${settings.payment.provider === 'flutterwave' ? 'selected' : ''}>Flutterwave</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-sm save-section" data-section="payment">Enregistrer</button>
        </div>

      </div>
    `;

    container.querySelectorAll('.save-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        if (section === 'general') {
          settings.general.site_name = document.getElementById('s-name').value;
          settings.general.tagline = document.getElementById('s-tagline').value;
          settings.general.language = document.getElementById('s-lang').value;
        } else if (section === 'appearance') {
          settings.appearance.theme = document.getElementById('s-theme').value;
          settings.appearance.visitor_theme = document.getElementById('s-visitor-theme').value;
        } else if (section === 'seo') {
          settings.seo.meta_title = document.getElementById('s-seo-title').value;
          settings.seo.meta_description = document.getElementById('s-seo-desc').value;
          settings.seo.og_image = document.getElementById('s-og-image').value;
        } else if (section === 'contact') {
          settings.contact.email = document.getElementById('s-email').value;
          settings.contact.phone = document.getElementById('s-phone').value;
          settings.contact.address = document.getElementById('s-address').value;
        } else if (section === 'social') {
          settings.social.facebook = document.getElementById('s-facebook').value;
          settings.social.twitter = document.getElementById('s-twitter').value;
          settings.social.instagram = document.getElementById('s-instagram').value;
          settings.social.whatsapp = document.getElementById('s-whatsapp').value;
        } else if (section === 'payment') {
          settings.payment.stripe_key = document.getElementById('s-stripe').value;
          settings.payment.provider = document.getElementById('s-provider').value;
        }

        btn.textContent = '✓ Enregistré';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        setTimeout(() => {
          btn.textContent = 'Enregistrer';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-primary');
        }, 1500);
      });
    });
  }

  App.registerPage('settings', render);
})();
