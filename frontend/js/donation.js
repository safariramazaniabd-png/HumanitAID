/* ═══════════════════════════════════════
   DONATION FORM — HumanitAID
   ═══════════════════════════════════════ */

const DonationForm = {
  selectedAmount: 100,
  selectedProvider: null,

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

    document.querySelector('.modal-notice')?.remove();

    if (status === 'success') {
      const ref = params.get('ref') || '';
      const amount = params.get('amount') || '';

      document.getElementById('modal-amount').textContent = amount ? '$' + Number(amount).toLocaleString() : I18N.t('don.paidReceived');
      document.getElementById('modal-cause').textContent = I18N.t('don.transmitted');
      document.getElementById('modal-ref').textContent = I18N.t('don.ref', { ref }) + I18N.t('don.definitiveSuffix');

      this.openModal();
    } else if (status === 'cancelled') {
      document.getElementById('modal-amount').textContent = I18N.t('don.cancelled.title');
      document.getElementById('modal-cause').textContent = I18N.t('don.cancelled.notSaved');
      document.getElementById('modal-ref').textContent = '';
      const banner = document.querySelector('.modal-cause');
      const label = document.createElement('div');
      label.className = 'modal-notice';
      label.style.cssText = 'font-family: var(--font-mono); font-size: var(--text-xs); color: var(--text-secondary); margin-top: 8px;';
      label.textContent = I18N.t('don.cancelled.msg');
      if (banner) banner.parentNode.insertBefore(label, banner.nextSibling);
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

  setSubmitLabel(text) {
    const el = document.querySelector('.btn-don .btn-don-label');
    if (el) el.textContent = text;
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
      alert(I18N.t('don.err.amount'));
      return;
    }

    const submitBtn = document.querySelector('.btn-don');
    this.setSubmitLabel(I18N.t('form.processing'));
    if (submitBtn) submitBtn.disabled = true;

    const resetSubmit = () => {
      if (submitBtn) submitBtn.disabled = false;
      this.setSubmitLabel(I18N.t('form.submit'));
    };

    const causeKey = document.getElementById('causeSelect')?.value || '';
    const causeLabel = I18N.t('causeopt.' + (causeKey || 'all'));
    const tab = this.getActiveTab();
    const providerName = this.selectedProvider || null;
    const method = tab === 'carte' ? (providerName || 'stripe') : tab === 'mobile' ? (providerName || 'flutterwave') : 'wire';
    const ref = 'HAD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    const visiblePanel = tab === 'carte' ? 'card' : tab === 'mobile' ? 'mobile' : 'wire';
    const mobileDetails = tab === 'mobile' ? {
      provider: providerName,
      phone: document.getElementById('mobile-phone')?.value || '',
      name: document.getElementById('mobile-name')?.value || '',
    } : {};

    const donationData = {
      donor_name: document.getElementById(visiblePanel === 'mobile' ? 'mobile-name' : visiblePanel === 'card' ? 'card-name' : 'wire-name')?.value || I18N.t('don.anonymous'),
      email: document.getElementById(visiblePanel === 'card' ? 'card-email' : visiblePanel === 'mobile' ? 'mobile-email' : 'wire-email')?.value || '',
      amount,
      currency: 'USD',
      method,
      cause: causeKey || 'toutes',
      reference: ref,
      provider: providerName,
      ...mobileDetails,
    };

    if (!donationData.email) {
      alert(I18N.t('don.err.email'));
      resetSubmit();
      return;
    }

    if (tab === 'carte') {
      try {
        const session = typeof createCheckoutSession === 'function'
          ? await createCheckoutSession(donationData)
          : { url: null, error: I18N.t('don.err.network') };
        if (session && session.url) {
          window.location.href = session.url;
          return;
        }
        alert((session && session.error) || I18N.t('don.err.network'));
        resetSubmit();
        return;
      } catch (err) {
        console.warn('Checkout failed:', err);
        alert(I18N.t('don.err.network'));
        resetSubmit();
        return;
      }
    }

    let result = null;
    try {
      if (typeof submitDonation === 'function') {
        result = await submitDonation(donationData);
      }
    } catch (err) {
      console.warn('Donation submit failed:', err);
      result = { success: false, error: I18N.t('don.err.submit') };
    }

    if (!result || result.success === false) {
      alert((result && result.error) || I18N.t('don.err.submit'));
      resetSubmit();
      return;
    }

    document.getElementById('modal-amount').textContent = '$' + amount.toLocaleString();
    document.getElementById('modal-cause').textContent = causeLabel;
    const refLine = result && result.ref ? result.ref : ref;
    document.getElementById('modal-ref').textContent = I18N.t('don.ref', { ref: refLine }) + I18N.t('don.confirmSuffix');

    document.querySelector('.modal-notice')?.remove();
    resetSubmit();
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