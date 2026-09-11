/* ═══════════════════════════════════════
   DONATION FORM — HumanitAID
   ═══════════════════════════════════════ */

const DonationForm = {
  selectedAmount: 100,
  selectedProvider: null,

  causeLabels: {
    deplaces: 'Déplacés & réfugiés de guerre',
    orphelins: 'Enfants orphelins',
    veuves: 'Veuves & femmes survivantes',
    victimes: 'Victimes de violences armées',
    handicapes: 'Personnes handicapées',
    toutes: 'Toutes les causes',
    '': 'Toutes les causes',
  },

  init() {
    this.bindAmountButtons();
    this.bindCustomAmount();
    this.bindPaymentTabs();
    this.bindProviderButtons();
    this.bindSubmit();
    this.bindModal();
    this.handleCheckoutReturn();
  },

  handleCheckoutReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('donation');
    if (!status) return;

    document.querySelector('.modal-demo-label')?.remove();

    if (status === 'success') {
      const ref = params.get('ref') || '';
      const amount = params.get('amount') || '';
      const isDemo = params.get('demo') === '1';

      document.getElementById('modal-amount').textContent = amount ? '$' + Number(amount).toLocaleString() : 'Paiement reçu';
      document.getElementById('modal-cause').textContent = 'Merci pour votre générosité.';
      document.getElementById('modal-ref').textContent = 'Référence : ' + ref + (isDemo ? '' : ' · Un reçu vous sera envoyé par email');

      if (isDemo) {
        const banner = document.querySelector('.modal-cause');
        const label = document.createElement('div');
        label.className = 'modal-demo-label';
        label.style.cssText = 'font-family: var(--font-mono); font-size: var(--text-xs); color: var(--warning, #f39c12); margin-top: 8px;';
        label.textContent = 'Mode démo — Aucun paiement réel traité.';
        if (banner) banner.parentNode.insertBefore(label, banner.nextSibling);
      }

      this.openModal();
    } else if (status === 'cancelled') {
      const banner = document.querySelector('.modal-cause');
      const label = document.createElement('div');
      label.className = 'modal-demo-label';
      label.style.cssText = 'font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary); margin-top: 8px;';
      label.textContent = 'Paiement annulé. Vous pouvez réessayer ou choisir un autre mode de paiement.';
      if (banner) banner.parentNode.insertBefore(label, banner.nextSibling);
      document.getElementById('modal-amount').textContent = 'Paiement annulé';
      document.getElementById('modal-cause').textContent = 'Don non enregistré';
      document.getElementById('modal-ref').textContent = '';
      this.openModal();
    }
  },

  bindAmountButtons() {
    document.querySelectorAll('.amount-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.amount, 10);
        this.selectAmount(val, btn);
      });
    });
  },

  selectAmount(val, btn) {
    this.selectedAmount = val;
    document.querySelectorAll('.amount-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    const custom = document.getElementById('customAmount');
    if (custom) custom.value = '';
    this.updateButtonAmount(val);
  },

  bindCustomAmount() {
    const custom = document.getElementById('customAmount');
    if (!custom) return;
    custom.addEventListener('input', () => {
      document.querySelectorAll('.amount-btn').forEach((b) => b.classList.remove('selected'));
      const v = parseInt(custom.value, 10) || 0;
      this.selectedAmount = v;
      this.updateButtonAmount(v || '?');
    });
  },

  updateButtonAmount(val) {
    const el = document.getElementById('btn-amount');
    if (el) el.textContent = val;
  },

  bindPaymentTabs() {
    document.querySelectorAll('.payment-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab, tab);
      });
    });
  },

  switchTab(tab, btn) {
    document.querySelectorAll('.payment-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.payment-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('panel-' + tab);
    if (panel) panel.classList.add('active');
  },

  bindProviderButtons() {
    document.querySelectorAll('.provider-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.provider-btn').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedProvider = btn.dataset.provider;
      });
    });
  },

  bindSubmit() {
    const submitBtn = document.querySelector('.btn-don');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.submit();
      });
    }
  },

  getActiveTab() {
    const activeTab = document.querySelector('.payment-tab.active');
    return activeTab ? activeTab.dataset.tab : 'carte';
  },

  async submit() {
    const customVal = parseInt(document.getElementById('customAmount')?.value, 10);
    const amount = customVal > 0 ? customVal : this.selectedAmount;

    if (!amount || amount < 1) {
      alert('Veuillez choisir ou saisir un montant valide.');
      return;
    }

    const submitBtn = document.querySelector('.btn-don');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Traitement...';
    }

    const causeKey = document.getElementById('causeSelect')?.value || '';
    const causeLabel = this.causeLabels[causeKey] || 'Toutes les causes';
    const tab = this.getActiveTab();
    const providerName = this.selectedProvider || null;
    const method = tab === 'carte' ? (providerName || 'stripe') : tab === 'mobile' ? (providerName || 'flutterwave') : 'wire';
    const ref = 'HAD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    let demo = false;
    let result = null;

    const visiblePanel = tab === 'carte' ? 'card' : tab === 'mobile' ? 'mobile' : 'wire';
    const p = method === 'mobile' ? {
      provider: providerName,
      phone: document.getElementById('mobile-phone')?.value || '',
      name: document.getElementById('mobile-name')?.value || '',
    } : {};

    const donationData = {
      donor_name: document.getElementById(visiblePanel === 'mobile' ? 'mobile-name' : visiblePanel === 'card' ? 'card-name' : 'wire-name')?.value || 'Anonyme',
      email: document.getElementById(visiblePanel === 'card' ? 'card-email' : visiblePanel === 'mobile' ? 'mobile-email' : 'wire-email')?.value || '',
      amount,
      currency: 'USD',
      method,
      cause: causeKey || 'toutes',
      reference: ref,
      provider: providerName,
      ...p,
    };

    if (tab === 'carte' && !donationData.email) {
      alert('Veuillez saisir votre email pour recevoir le reçu.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmer le don';
      return;
    }

    if (tab === 'carte') {
      try {
        const session = typeof createCheckoutSession === 'function' ? await createCheckoutSession(donationData) : { url: null, demo: true };
        if (session && session.url) {
          window.location.href = session.url;
          return;
        }
        demo = true;
      } catch (err) {
        console.warn('Checkout failed:', err);
        demo = true;
      }
    } else {
      try {
        if (typeof submitDonation === 'function') {
          result = await submitDonation(donationData);
          demo = !!(result && result.demo);
        } else {
          demo = true;
        }
      } catch (err) {
        console.warn('Donation submit failed:', err);
        demo = true;
      }
    }

    document.getElementById('modal-amount').textContent = '$' + amount.toLocaleString();
    document.getElementById('modal-cause').textContent = causeLabel;
    const refLine = result && result.ref ? result.ref : ref;
    document.getElementById('modal-ref').textContent = 'Référence : ' + refLine + (demo ? '' : ' · Un reçu vous sera envoyé par email');

    const demoLabel = document.querySelector('.modal-demo-label');
    if (demo) {
      if (!demoLabel) {
        const banner = document.querySelector('.modal-cause');
        const label = document.createElement('div');
        label.className = 'modal-demo-label';
        label.style.cssText = 'font-family: var(--font-mono); font-size: var(--text-xs); color: var(--warning, #f39c12); margin-top: 8px;';
        label.textContent = 'Mode démo — Don enregistré localement, aucun paiement traité.';
        if (banner) banner.parentNode.insertBefore(label, banner.nextSibling);
      }
    } else if (demoLabel) {
      demoLabel.remove();
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirmer le don';
    }

    this.openModal();
  },

  openModal() {
    const modal = document.getElementById('modal');
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  },

  closeModal() {
    const modal = document.getElementById('modal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  bindModal() {
    const modal = document.getElementById('modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }

    document.querySelectorAll('.modal-close, .modal-x').forEach((btn) => {
      btn.addEventListener('click', () => this.closeModal());
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  },
};