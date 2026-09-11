/* =========================================
   HumanitAID Admin — Donations
   ========================================= */

(function () {
  const DEMO_DONATIONS = [
    { id: 1, ref: 'DON-2847', donor: 'Amira K.', amount: 150, cause: 'Eau potable', status: 'paid', date: '2026-09-03', provider: 'Stripe' },
    { id: 2, ref: 'DON-2846', donor: 'Jean-Pierre M.', amount: 75, cause: 'Santé d\'urgence', status: 'paid', date: '2026-09-03', provider: 'Mobile Money' },
    { id: 3, ref: 'DON-2845', donor: 'Fatima D.', amount: 200, cause: 'Éducation', status: 'paid', date: '2026-09-02', provider: 'Stripe' },
    { id: 4, ref: 'DON-2844', donor: 'Anonyme', amount: 50, cause: 'Alimentation', status: 'paid', date: '2026-09-02', provider: 'Virement' },
    { id: 5, ref: 'DON-2843', donor: 'Moussa T.', amount: 500, cause: 'Shelter', status: 'paid', date: '2026-09-01', provider: 'Stripe' },
    { id: 6, ref: 'DON-2842', donor: 'Sophie L.', amount: 30, cause: 'Eau potable', status: 'paid', date: '2026-09-01', provider: 'Mobile Money' },
    { id: 7, ref: 'DON-2841', donor: 'Patrick N.', amount: 100, cause: 'Santé d\'urgence', status: 'pending', date: '2026-08-31', provider: 'Stripe' },
    { id: 8, ref: 'DON-2840', donor: 'Aminata S.', amount: 250, cause: 'Alimentation', status: 'paid', date: '2026-08-31', provider: 'Stripe' },
    { id: 9, ref: 'DON-2839', donor: 'Luc M.', amount: 15, cause: 'Éducation', status: 'failed', date: '2026-08-30', provider: 'Mobile Money' },
    { id: 10, ref: 'DON-2838', donor: 'Brigitte K.', amount: 1000, cause: 'Eau potable', status: 'paid', date: '2026-08-30', provider: 'Virement' }
  ];

  let statusFilter = 'all';

  function filtered() {
    if (statusFilter === 'all') return DEMO_DONATIONS;
    return DEMO_DONATIONS.filter(d => d.status === statusFilter);
  }

  function render(container) {
    const total = DEMO_DONATIONS.reduce((s, d) => s + d.amount, 0);
    const today = DEMO_DONATIONS.filter(d => d.date === '2026-09-03').reduce((s, d) => s + d.amount, 0);
    const month = DEMO_DONATIONS.filter(d => d.date.startsWith('2026-09')).reduce((s, d) => s + d.amount, 0);
    const paid = DEMO_DONATIONS.filter(d => d.status === 'paid');
    const avg = paid.length ? Math.round(total / paid.length) : 0;
    const counts = { all: DEMO_DONATIONS.length, paid: DEMO_DONATIONS.filter(d => d.status === 'paid').length, pending: DEMO_DONATIONS.filter(d => d.status === 'pending').length, failed: DEMO_DONATIONS.filter(d => d.status === 'failed').length };

    container.innerHTML = `
      <div class="section-header">
        <h2>Dons <span class="demo-badge">DEMO</span></h2>
        <button class="btn btn-secondary" id="export-dons-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/></svg> Exporter (démo)</button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total des dons <span class="demo-badge">DEMO</span></div>
          <div class="stat-value">${App.formatMoney(total)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Aujourd'hui</div>
          <div class="stat-value">${App.formatMoney(today)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ce mois</div>
          <div class="stat-value">${App.formatMoney(month)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Don moyen</div>
          <div class="stat-value">${App.formatMoney(avg)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Nombre de dons</div>
          <div class="stat-value">${DEMO_DONATIONS.length}</div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${statusFilter === 'all' ? 'active' : ''}" data-filter="all">Tous (${counts.all})</button>
        <button class="tab ${statusFilter === 'paid' ? 'active' : ''}" data-filter="paid">Payés (${counts.paid})</button>
        <button class="tab ${statusFilter === 'pending' ? 'active' : ''}" data-filter="pending">En attente (${counts.pending})</button>
        <button class="tab ${statusFilter === 'failed' ? 'active' : ''}" data-filter="failed">Échoués (${counts.failed})</button>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Donateur</th>
              <th>Montant</th>
              <th>Cause</th>
              <th>Statut</th>
              <th>Fournisseur</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${filtered().map(d => `
              <tr>
                <td><strong>${d.ref}</strong></td>
                <td>${d.donor}</td>
                <td><strong>${App.formatMoney(d.amount)}</strong></td>
                <td>${d.cause}</td>
                <td>${App.statusBadge(d.status)}</td>
                <td class="text-muted">${d.provider}</td>
                <td>${App.formatDate(d.date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { statusFilter = t.dataset.filter; render(container); });
    });

    document.getElementById('export-dons-btn').addEventListener('click', () => {
      App.openModal('Exporter les dons', '<p class="text-muted">L\'export est disponible lorsque le backend est connecté. En mode démo, les données ne sont pas exportées.</p>', '<button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>');
    });
  }

  App.registerPage('donations', function (container) { statusFilter = 'all'; render(container); });
})();
