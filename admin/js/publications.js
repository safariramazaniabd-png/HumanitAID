/* =========================================
   HumanitAID Admin — Publications
   Branché sur l'API réelle (backend/routes/posts.js).
   Chaque publication est rattachée à une cause réelle (backend/routes/causes.js).
   ========================================= */

(function () {
  let pubs = [];
  let causesList = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let editingPub = null;
  let loadError = null;

  async function loadCauses() {
    const data = await App.api('/causes');
    causesList = (data && data.causes) || [];
  }

  async function loadPubs(container) {
    container.innerHTML = '<div class="section-header"><h2>Publications</h2></div><p class="text-muted">Chargement…</p>';
    const qs = new URLSearchParams();
    if (currentFilter !== 'all') qs.set('status', currentFilter);
    if (searchQuery) qs.set('search', searchQuery);
    qs.set('limit', '100');

    const data = await App.api(`/posts?${qs.toString()}`);
    if (!data || !data.posts) {
      loadError = true;
      pubs = [];
    } else {
      loadError = false;
      pubs = data.posts;
    }
    renderList(container);
  }

  function causeLabel(cause_id) {
    const cause = causesList.find(c => c.id === cause_id);
    return cause ? cause.title : '— Aucune cause —';
  }

  function renderList(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header"><h2>Publications</h2></div>
        <p class="text-muted">Impossible de charger les publications depuis le serveur. Vérifiez la connexion à l'API.</p>
        <button class="btn btn-secondary" id="retry-pubs">Réessayer</button>
      `;
      document.getElementById('retry-pubs').addEventListener('click', () => loadPubs(container));
      return;
    }

    const isTrash = currentFilter === 'trashed';

    container.innerHTML = `
      <div class="section-header">
        <h2>Publications</h2>
        ${!isTrash ? '<button class="btn btn-primary" id="new-pub-btn">+ Nouvelle publication</button>' : ''}
      </div>
      <div class="tabs">
        <button class="tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Toutes</button>
        <button class="tab ${currentFilter === 'published' ? 'active' : ''}" data-filter="published">Publiées</button>
        <button class="tab ${currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">Brouillons</button>
        <button class="tab ${currentFilter === 'scheduled' ? 'active' : ''}" data-filter="scheduled">Planifiées</button>
        <button class="tab ${currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">Archivées</button>
        <button class="tab ${currentFilter === 'trashed' ? 'active' : ''}" data-filter="trashed">Corbeille</button>
      </div>
      <div class="toolbar">
        <div class="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Rechercher..." id="pub-search" value="${escHtml(searchQuery)}">
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Cause</th>
              <th>Catégorie</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pubs.map(p => {
              const isTrash = currentFilter === 'trashed';
              return `
              <tr>
                <td><strong>${escHtml(p.title)}</strong>${p.is_featured ? ' ⭐' : ''}</td>
                <td>${p.cause_title ? causeLabel(p.cause_id) : '<span class="text-muted">—</span>'}</td>
                <td>${p.category ? `<span class="badge badge-info">${escHtml(p.category)}</span>` : ''}</td>
                <td>${App.statusBadge(p.status)}</td>
                <td>${App.formatDate(p.published_at || p.created_at)}</td>
                <td class="table-actions">
                  ${isTrash
                    ? `<button class="btn btn-secondary btn-sm restore-pub" data-id="${p.id}">Restaurer</button>`
                    : `<button class="btn btn-secondary btn-sm edit-pub" data-id="${p.id}">Modifier</button>
                       <button class="btn btn-ghost btn-sm delete-pub" data-id="${p.id}">Supprimer</button>`}
                </td>
              </tr>`
            }).join('')}
            ${pubs.length === 0 ? `<tr><td colspan="6" class="text-muted" style="text-align:center;padding:40px;">${isTrash ? 'Corbeille vide' : 'Aucune publication trouvée'}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { currentFilter = t.dataset.filter; loadPubs(container); });
    });

    const searchInput = document.getElementById('pub-search');
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadPubs(container), 300);
    });

    const newBtn = document.getElementById('new-pub-btn');
    if (newBtn) newBtn.addEventListener('click', () => { editingPub = null; renderForm(container); });

    container.querySelectorAll('.edit-pub').forEach(btn => {
      btn.addEventListener('click', () => {
        editingPub = pubs.find(p => p.id === btn.dataset.id);
        renderForm(container);
      });
    });

    container.querySelectorAll('.delete-pub').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Déplacer cette publication vers la corbeille ?', async () => {
          await App.api(`/posts/${btn.dataset.id}`, { method: 'DELETE' });
          loadPubs(container);
        });
      });
    });

    container.querySelectorAll('.restore-pub').forEach(btn => {
      btn.addEventListener('click', async () => {
        await App.api(`/posts/${btn.dataset.id}/restore`, { method: 'POST' });
        loadPubs(container);
      });
    });
  }

  function renderForm(container) {
    const p = editingPub || { title: '', slug: '', summary: '', content: '', featured_image: '', video_url: '', category: 'Urgence', cause_id: '', status: 'draft', is_featured: false, published_at: '', seo_title: '', seo_description: '' };
    const pubDate = p.published_at ? new Date(p.published_at).toISOString().split('T')[0] : '';

    container.innerHTML = `
      <div class="section-header">
        <h2>${editingPub ? 'Modifier' : 'Nouvelle'} publication</h2>
        <button class="btn btn-secondary" id="back-to-list">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu</div>
        <div class="form-group">
          <label>Titre</label>
          <input type="text" id="pub-title" value="${escHtml(p.title)}">
        </div>
        <div class="form-group">
          <label>Slug</label>
          <input type="text" id="pub-slug" value="${escHtml(p.slug || '')}">
        </div>
        <div class="form-group">
          <label>Résumé</label>
          <textarea id="pub-summary" rows="3">${escHtml(p.summary || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Contenu</label>
          <textarea id="pub-content" rows="10" style="max-height:400px;">${escHtml(p.content || '')}</textarea>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média</div>
        <div class="form-row">
          <div class="form-group">
            <label>Image à la une (URL)</label>
            <input type="url" id="pub-image" value="${escHtml(p.featured_image || '')}" placeholder="https://...">
          </div>
          <div class="form-group">
            <label>Vidéo (URL)</label>
            <input type="url" id="pub-video" value="${escHtml(p.video_url || '')}" placeholder="https://youtube.com/...">
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Paramètres</div>
        <div class="form-row">
          <div class="form-group">
            <label>Cause associée</label>
            <select id="pub-cause">
              <option value="">— Aucune cause —</option>
              ${causesList.map(c => `<option value="${c.id}" ${p.cause_id === c.id ? 'selected' : ''}>${escHtml(c.title)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <select id="pub-category">
              ${['Urgence', 'Terrain', 'Témoignage', 'Rapport', 'Partenariat', 'Plaidoyer'].map(cat =>
                `<option ${p.category === cat ? 'selected' : ''}>${cat}</option>`
              ).join('')}
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="pub-status">
              <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="published" ${p.status === 'published' ? 'selected' : ''}>Publié</option>
              <option value="scheduled" ${p.status === 'scheduled' ? 'selected' : ''}>Planifié</option>
              <option value="archived" ${p.status === 'archived' ? 'selected' : ''}>Archivé</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date de publication</label>
            <input type="date" id="pub-date" value="${pubDate}">
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">SEO</div>
        <div class="form-group">
          <label>Titre SEO</label>
          <input type="text" id="pub-seo-title" value="${escHtml(p.seo_title || '')}">
        </div>
        <div class="form-group">
          <label>Description SEO</label>
          <textarea id="pub-seo-desc" rows="2">${escHtml(p.seo_description || '')}</textarea>
        </div>
      </div>
      <p class="text-sm text-muted" id="pub-save-error" hidden></p>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-secondary" id="save-draft-btn">Enregistrer brouillon</button>
        <button class="btn btn-primary" id="publish-btn">${editingPub ? 'Mettre à jour' : 'Publier'}</button>
      </div>
    `;

    document.getElementById('back-to-list').addEventListener('click', () => loadPubs(container));
    document.getElementById('save-draft-btn').addEventListener('click', () => savePub(container, 'draft'));
    document.getElementById('publish-btn').addEventListener('click', () => savePub(container, document.getElementById('pub-status').value));
  }

  async function savePub(container, status) {
    const dateVal = document.getElementById('pub-date').value;
    const data = {
      title: document.getElementById('pub-title').value,
      slug: document.getElementById('pub-slug').value,
      summary: document.getElementById('pub-summary').value,
      content: document.getElementById('pub-content').value,
      featured_image: document.getElementById('pub-image').value,
      video_url: document.getElementById('pub-video').value,
      cause_id: document.getElementById('pub-cause').value || null,
      category: document.getElementById('pub-category').value,
      status: status,
      is_featured: document.getElementById('pub-featured') ? document.getElementById('pub-featured').checked : false,
      published_at: status === 'published' ? (dateVal ? new Date(dateVal).toISOString() : new Date().toISOString()) : (dateVal ? new Date(dateVal).toISOString() : null),
      seo_title: document.getElementById('pub-seo-title').value,
      seo_description: document.getElementById('pub-seo-desc').value,
    };

    if (!data.title || data.title.trim().length < 3) {
      const err = document.getElementById('pub-save-error');
      err.hidden = false;
      err.textContent = 'Le titre doit contenir au moins 3 caractères.';
      return;
    }

    const btn = editingPub ? document.getElementById('publish-btn') : document.getElementById('publish-btn');
    btn.disabled = true;

    const res = editingPub
      ? await App.api(`/posts/${editingPub.id}`, { method: 'PUT', body: JSON.stringify({ ...data, id: editingPub.id }) })
      : await App.api('/posts', { method: 'POST', body: JSON.stringify(data) });

    btn.disabled = false;

    if (!res || res.error) {
      const err = document.getElementById('pub-save-error');
      err.hidden = false;
      err.textContent = (res && (res.error ? `${res.error}${res.details ? ' : ' + res.details.join(', ') : ''}` : null)) || 'Erreur de connexion au serveur.';
      return;
    }

    editingPub = null;
    loadPubs(container);
  }

  App.registerPage('publications', async function (container) {
    editingPub = null;
    currentFilter = 'all';
    searchQuery = '';
    await loadCauses();
    loadPubs(container);
  });
})();