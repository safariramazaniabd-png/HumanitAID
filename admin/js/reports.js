/* =========================================
   HumanitAID Admin — Rapports
   Branché dès le départ sur l'API réelle (frontend/api/reports/).
   Distinct des Publications : chaque rapport doit citer une
   source (OCHA/UNHCR/UNICEF/ICRC/WHO/WFP/IOM ou HumanitAID pour
   le terrain propre) — contrainte imposée en base, pas juste ici.
   ========================================= */

(function () {
  const SOURCES = ['OCHA', 'UNHCR', 'UNICEF', 'ICRC', 'WHO', 'WFP', 'IOM', 'HumanitAID'];

  let items = [];
  let causesList = []; // pour le sélecteur multi-causes
  let currentFilter = 'all';
  let searchQuery = '';
  let editing = null;
  let loadError = null;

  async function loadReports(container) {
    container.innerHTML = '<div class="section-header"><h2>Rapports</h2></div><p class="text-muted">Chargement…</p>';
    const qs = new URLSearchParams();
    if (currentFilter !== 'all') qs.set('status', currentFilter);
    if (searchQuery) qs.set('search', searchQuery);
    qs.set('limit', '100');

    const [reportsRes, causesRes] = await Promise.all([
      App.api(`/reports?${qs.toString()}`),
      causesList.length ? Promise.resolve({ causes: causesList }) : App.api('/causes'),
    ]);

    if (!reportsRes || !reportsRes.reports) {
      loadError = true;
      items = [];
    } else {
      loadError = false;
      items = reportsRes.reports;
    }
    if (causesRes && causesRes.causes) causesList = causesRes.causes;

    render(container);
  }

  function render(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header"><h2>Rapports</h2></div>
        <p class="text-muted">Impossible de charger les rapports depuis le serveur. Vérifiez la connexion à l'API.</p>
        <button class="btn btn-secondary" id="retry-reports">Réessayer</button>
      `;
      document.getElementById('retry-reports').addEventListener('click', () => loadReports(container));
      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <h2>Rapports</h2>
        <button class="btn btn-primary" id="new-report-btn">+ Nouveau rapport</button>
      </div>
      <div class="tabs">
        <button class="tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Tous</button>
        <button class="tab ${currentFilter === 'published' ? 'active' : ''}" data-filter="published">Publiés</button>
        <button class="tab ${currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">Brouillons</button>
        <button class="tab ${currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">Archivés</button>
      </div>
      <div class="toolbar">
        <div class="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Rechercher..." id="report-search" value="${escHtml(searchQuery)}">
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>Titre</th><th>Source</th><th>Causes liées</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${items.map(r => `
              <tr>
                <td><strong>${escHtml(r.title)}</strong></td>
                <td><span class="badge badge-info">${escHtml(r.source_name)}</span></td>
                <td class="text-muted">${(r.causes || []).map(c => escHtml(c.title)).join(', ') || '—'}</td>
                <td>${App.statusBadge(r.status)}</td>
                <td>${App.formatDate(r.published_date || r.created_at)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-report" data-id="${r.id}">Modifier</button>
                  <button class="btn btn-ghost btn-sm delete-report" data-id="${r.id}">Supprimer</button>
                </td>
              </tr>
            `).join('')}
            ${items.length === 0 ? '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:40px;">Aucun rapport</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { currentFilter = t.dataset.filter; loadReports(container); });
    });

    const searchInput = document.getElementById('report-search');
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadReports(container), 300);
    });

    document.getElementById('new-report-btn').addEventListener('click', () => { editing = null; renderForm(container); });

    container.querySelectorAll('.edit-report').forEach(btn => {
      btn.addEventListener('click', () => { editing = items.find(r => r.id === btn.dataset.id); renderForm(container); });
    });
    container.querySelectorAll('.delete-report').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer définitivement ce rapport ? Cette action est irréversible.', async () => {
          await App.api(`/reports/${btn.dataset.id}`, { method: 'DELETE' });
          loadReports(container);
        });
      });
    });
  }

  function renderForm(container) {
    const r = editing || { title: '', slug: '', summary: '', content: '', featured_image: '', source_name: 'HumanitAID', source_url: '', published_date: '', status: 'draft', causes: [] };
    const linkedIds = new Set((r.causes || []).map(c => c.id));
    const pubDate = r.published_date ? String(r.published_date).slice(0, 10) : '';

    container.innerHTML = `
      <div class="section-header">
        <h2>${editing ? 'Modifier' : 'Nouveau'} rapport</h2>
        <button class="btn btn-secondary" id="back-report">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu</div>
        <div class="form-group"><label>Titre</label><input type="text" id="report-title" value="${escHtml(r.title)}"></div>
        <div class="form-group"><label>Slug</label><input type="text" id="report-slug" value="${escHtml(r.slug || '')}" placeholder="laisser vide pour génération automatique"></div>
        <div class="form-group"><label>Résumé</label><textarea id="report-summary" rows="3">${escHtml(r.summary || '')}</textarea></div>
        <div class="form-group"><label>Contenu</label><textarea id="report-content" rows="8">${escHtml(r.content || '')}</textarea></div>
        <div class="form-group"><label>Image (URL)</label><input type="url" id="report-image" value="${escHtml(r.featured_image || '')}" placeholder="https://..."></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Source <span style="font-weight:400;color:var(--text-secondary);">— obligatoire, jamais inventée</span></div>
        <div class="form-row">
          <div class="form-group">
            <label>Organisation</label>
            <select id="report-source">
              ${SOURCES.map(s => `<option value="${s}" ${r.source_name === s ? 'selected' : ''}>${s === 'HumanitAID' ? 'HumanitAID (terrain propre)' : s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Date du rapport</label><input type="date" id="report-date" value="${pubDate}"></div>
        </div>
        <div class="form-group" id="report-url-group">
          <label>URL source (obligatoire sauf terrain propre)</label>
          <input type="url" id="report-url" value="${escHtml(r.source_url || '')}" placeholder="https://reliefweb.int/...">
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Causes liées</div>
        ${causesList.map(c => `
          <div class="form-check">
            <input type="checkbox" id="cause-${c.id}" value="${c.id}" class="report-cause-check" ${linkedIds.has(c.id) ? 'checked' : ''}>
            <label for="cause-${c.id}">${escHtml(c.title)}</label>
          </div>
        `).join('')}
      </div>
      <div class="form-section">
        <div class="form-group">
          <label>Statut</label>
          <select id="report-status">
            <option value="draft" ${r.status === 'draft' ? 'selected' : ''}>Brouillon</option>
            <option value="published" ${r.status === 'published' ? 'selected' : ''}>Publié</option>
            <option value="archived" ${r.status === 'archived' ? 'selected' : ''}>Archivé</option>
          </select>
        </div>
      </div>
      <p class="text-sm text-muted" id="report-save-error" hidden></p>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-report-btn">${editing ? 'Mettre à jour' : 'Créer le rapport'}</button>
      </div>
    `;

    document.getElementById('back-report').addEventListener('click', () => loadReports(container));

    // Terrain propre HumanitAID : l'URL source devient optionnelle, on
    // le reflète visuellement (le serveur reste le rempart final).
    const sourceSelect = document.getElementById('report-source');
    const urlGroup = document.getElementById('report-url-group');
    function syncUrlRequirement() {
      const isInternal = sourceSelect.value === 'HumanitAID';
      urlGroup.style.opacity = isInternal ? '0.6' : '1';
      urlGroup.querySelector('label').textContent = isInternal
        ? 'URL source (optionnelle — terrain propre)'
        : 'URL source (obligatoire)';
    }
    sourceSelect.addEventListener('change', syncUrlRequirement);
    syncUrlRequirement();

    document.getElementById('save-report-btn').addEventListener('click', async () => {
      const causeIds = Array.from(document.querySelectorAll('.report-cause-check:checked')).map(el => el.value);
      const data = {
        title: document.getElementById('report-title').value,
        slug: document.getElementById('report-slug').value,
        summary: document.getElementById('report-summary').value,
        content: document.getElementById('report-content').value,
        featured_image: document.getElementById('report-image').value,
        source_name: document.getElementById('report-source').value,
        source_url: document.getElementById('report-url').value,
        published_date: document.getElementById('report-date').value || null,
        status: document.getElementById('report-status').value,
        cause_ids: causeIds,
      };

      if (!data.title || data.title.trim().length < 5) {
        const err = document.getElementById('report-save-error');
        err.hidden = false;
        err.textContent = 'Le titre doit contenir au moins 5 caractères.';
        return;
      }
      if (data.source_name !== 'HumanitAID' && !data.source_url) {
        const err = document.getElementById('report-save-error');
        err.hidden = false;
        err.textContent = 'L\'URL source est obligatoire pour toute source externe.';
        return;
      }

      const btn = document.getElementById('save-report-btn');
      btn.disabled = true;

      const res = editing
        ? await App.api(`/reports/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await App.api('/reports', { method: 'POST', body: JSON.stringify(data) });

      btn.disabled = false;

      if (!res || res.error) {
        const err = document.getElementById('report-save-error');
        err.hidden = false;
        err.textContent = (res && (res.error ? `${res.error}${res.details ? ' : ' + res.details.join(', ') : ''}` : null)) || 'Erreur de connexion au serveur.';
        return;
      }

      editing = null;
      loadReports(container);
    });
  }

  App.registerPage('reports', async function (container) {
    editing = null;
    currentFilter = 'all';
    searchQuery = '';
    loadReports(container);
  });
})();
