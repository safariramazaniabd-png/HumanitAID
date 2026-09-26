/* ═══════════════════════════════════════
   PWA-INSTALL.JS — Prompt d'installation HumanitAID
   Chromium/Android uniquement : beforeinstallprompt n'existe pas
   sur Safari/iOS (Apple n'implémente pas cette API — "Ajouter à
   l'écran d'accueil" y reste manuel, hors de notre contrôle).
   ═══════════════════════════════════════ */

(function () {
  const DISMISS_KEY = 'humanitaid-pwa-install-dismissed';
  const DISMISS_DAYS = 14;
  const SHOW_AFTER_SCROLL_PX = 600; // évite d'afficher dès le premier écran

  let deferredPrompt = null;
  let bannerShown = false;

  function isDismissedRecently() {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    const elapsedDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return elapsedDays < DISMISS_DAYS;
  }

  function isAlreadyInstalled() {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.setAttribute('role', 'complementary');
    banner.setAttribute('aria-label', I18N.t('pwa.install.title'));
    banner.innerHTML = `
      <div class="pwa-install-icon">
        <img src="/assets/icons/icon-192.png" alt="" width="40" height="40">
      </div>
      <div class="pwa-install-body">
        <strong data-i18n="pwa.install.title">${I18N.t('pwa.install.title')}</strong>
        <p data-i18n="pwa.install.text">${I18N.t('pwa.install.text')}</p>
      </div>
      <div class="pwa-install-actions">
        <button type="button" class="btn btn-outline btn-sm pwa-install-dismiss" data-i18n="pwa.install.dismiss">${I18N.t('pwa.install.dismiss')}</button>
        <button type="button" class="btn btn-primary btn-sm pwa-install-accept" data-i18n="pwa.install.btn">${I18N.t('pwa.install.btn')}</button>
      </div>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add('visible'));

    banner.querySelector('.pwa-install-dismiss').addEventListener('click', () => {
      dismissBanner(banner);
    });

    banner.querySelector('.pwa-install-accept').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      banner.querySelector('.pwa-install-accept').disabled = true;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      // Qu'il accepte ou refuse la boîte de dialogue native, on referme
      // notre bandeau : l'événement appinstalled prendra le relais si
      // l'installation a réellement lieu.
      removeBanner(banner);
      if (outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      }
    });

    return banner;
  }

  function removeBanner(banner) {
    banner.classList.remove('visible');
    setTimeout(() => banner.remove(), 300);
  }

  function dismissBanner(banner) {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    removeBanner(banner);
  }

  function maybeShowBanner() {
    if (bannerShown || !deferredPrompt || isAlreadyInstalled() || isDismissedRecently()) return;
    bannerShown = true;
    buildBanner();
  }

  // Contrôle dans le menu mobile (#mobile-pwa-group) : contrairement au
  // bandeau flottant, pas de délai/scroll — il reste simplement disponible
  // dès que l'installation est possible, pour qui va le chercher dans le
  // menu plutôt que d'attendre une proposition automatique.
  let menuControlWired = false;
  function revealMenuInstallControl() {
    if (isAlreadyInstalled()) return;
    const group = document.getElementById('mobile-pwa-group');
    const btn = document.getElementById('mobile-install-btn');
    if (!group || !btn) return;
    group.hidden = false;
    if (menuControlWired) return;
    menuControlWired = true;
    btn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      btn.disabled = true;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      btn.disabled = false;
      group.hidden = true;
    });
  }

  function hideMenuInstallControl() {
    const group = document.getElementById('mobile-pwa-group');
    if (group) group.hidden = true;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    revealMenuInstallControl();

    // Déclenchement après une activité minimale (scroll), pas au chargement :
    // on laisse la personne découvrir le site avant de lui proposer l'app.
    let triggered = false;
    function onScroll() {
      if (triggered || window.scrollY < SHOW_AFTER_SCROLL_PX) return;
      triggered = true;
      window.removeEventListener('scroll', onScroll);
      maybeShowBanner();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    // Si la personne ne scrolle pas mais reste longtemps sur la page,
    // on propose quand même après un délai raisonnable.
    setTimeout(() => { if (!triggered) { triggered = true; window.removeEventListener('scroll', onScroll); maybeShowBanner(); } }, 20000);
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    localStorage.removeItem(DISMISS_KEY);
    hideMenuInstallControl();
    const existing = document.querySelector('.pwa-install-banner');
    if (existing) removeBanner(existing);
  });
})();
