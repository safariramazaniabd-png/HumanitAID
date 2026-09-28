/* =========================================
   HumanitAID Admin — Actualités
   Branché sur l'API réelle (frontend/api/news/).
   ========================================= */

(function () {
  let items = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let editing = null;
  let loadError = null;

  const CATEGORIES = ['Urgence', 'Terrain', 'Témoignage', 'Rapport', 'Partenariat', 'Plaidoyer'];

  async function loadNews(container) {
    container.innerHTML = '<div class="section-header"><h2>Actualités</h2></div><p class="text-muted">Chargement…</p>';
    const qs = new URLSearchParams();
    if (currentFilter !== 'all') qs.set('status', currentFilter);
    if (searchQuery) qs.set('search', searchQuery);
    qs.set('limit', '100');

    const data = await App.api(`/news?${qs.toString()}`);
    if (!data || !data.news) {
      loadError = true;
      items = [];
    } else {
      loadError = false;
      items = data.news;
    }
    renderList(container);
  }

  function renderList(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header"><h2>Actualités</h2></div>
        <p class="text-muted">Impossible de charger les actualités depuis le serveur. Vérifiez la connexion à l'API.</p>
        <button class="btn btn-secondary" id="retry-news">Réessayer</button>
      `;
      document.getElementById('retry-news').addEventListener('click', () => loadNews(container));
      return;
    }

    container.innerHTML = `
      <div class="section-header">
        <h2>Actualités</h2>
        <button class="btn btn-primary" id="new-news-btn">+ Nouvelle actualité</button>
      </div>
      <div class="tabs">
        <button class="tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Toutes</button>
        <button class="tab ${currentFilter === 'published' ? 'active' : ''}" data-filter="published">Publiées</button>
        <button class="tab ${currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">Brouillons</button>
        <button class="tab ${currentFilter === 'scheduled' ? 'active' : ''}" data-filter="scheduled">Planifiées</button>
        <button class="tab ${currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">Archivées</button>
      </div>
      <div class="toolbar">
        <div class="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Rechercher..." id="news-search" value="${escHtml(searchQuery)}">
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>Titre</th><th>Catégorie</th><th>Statut</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${items.map(n => `
              <tr>
                <td><strong>${escHtml(n.title)}</strong>${n.is_featured ? ' ⭐' : ''}</td>
                <td>${n.category ? `<span class="badge badge-info">${escHtml(n.category)}</span>` : ''}</td>
                <td>${App.statusBadge(n.status)}</td>
                <td>${App.formatDate(n.published_at || n.created_at)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-news" data-id="${n.id}">Modifier</button>
                  <button class="btn btn-ghost btn-sm delete-news" data-id="${n.id}">Supprimer</button>
                </td>
              </tr>
            `).join('')}
            ${items.length === 0 ? '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:40px;">Aucune actualité</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { currentFilter = t.dataset.filter; loadNews(container); });
    });

    const searchInput = document.getElementById('news-search');
    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadNews(container), 300);
    });

    document.getElementById('new-news-btn').addEventListener('click', () => { editing = null; renderForm(container); });

    container.querySelectorAll('.edit-news').forEach(btn => {
      btn.addEventListener('click', () => { editing = items.find(n => n.id === btn.dataset.id); renderForm(container); });
    });
    container.querySelectorAll('.delete-news').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer définitivement cette actualité ? Cette action est irréversible.', async () => {
          await App.api(`/news/${btn.dataset.id}`, { method: 'DELETE' });
          loadNews(container);
        });
      });
    });
  }

  function renderForm(container) {
    const n = editing || { title: '', slug: '', summary: '', content: '', featured_image: '', video_url: '', category: 'Urgence', status: 'draft', is_featured: false, published_at: '', seo_title: '', seo_description: '' };
    const pubDate = n.published_at ? new Date(n.published_at).toISOString().split('T')[0] : '';

    container.innerHTML = `
      <div class="section-header">
        <h2>${editing ? 'Modifier' : 'Nouvelle'} actualité</h2>
        <button class="btn btn-secondary" id="back-news">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu</div>
        <div class="form-group"><label>Titre</label><input type="text" id="news-title" value="${escHtml(n.title)}"></div>
        <div class="form-group"><label>Slug</label><input type="text" id="news-slug" value="${escHtml(n.slug || '')}" placeholder="laisser vide pour génération automatique"></div>
        <div class="form-group"><label>Résumé</label><textarea id="news-summary" rows="3">${escHtml(n.summary || '')}</textarea></div>
        <div class="form-group"><label>Contenu</label><textarea id="news-content" rows="10" style="max-height:400px;">${escHtml(n.content || '')}</textarea></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média</div>
        <div class="form-row">
          <div class="form-group"><label>Image à la une (URL)</label><input type="url" id="news-image" value="${escHtml(n.featured_image || '')}" placeholder="https://..."></div>
          <div class="form-group"><label>Vidéo (URL)</label><input type="url" id="news-video" value="${escHtml(n.video_url || '')}" placeholder="https://..."></div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Paramètres</div>
        <div class="form-row">
          <div class="form-group">
            <label>Catégorie</label>
            <select id="news-category">
              ${CATEGORIES.map(cat => `<option ${n.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select id="news-status">
              <option value="draft" ${n.status === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="published" ${n.status === 'published' ? 'selected' : ''}>Publié</option>
              <option value="scheduled" ${n.status === 'scheduled' ? 'selected' : ''}>Planifié</option>
              <option value="archived" ${n.status === 'archived' ? 'selected' : ''}>Archivé</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Date de publication</label><input type="date" id="news-date" value="${pubDate}"></div>
        </div>
        <div class="form-check">
          <input type="checkbox" id="news-featured" ${n.is_featured ? 'checked' : ''}>
          <label for="news-featured">Article à la une</label>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">SEO</div>
        <div class="form-group"><label>Titre SEO</label><input type="text" id="news-seo-title" value="${escHtml(n.seo_title || '')}"></div>
        <div class="form-group"><label>Description SEO</label><textarea id="news-seo-desc" rows="2">${escHtml(n.seo_description || '')}</textarea></div>
      </div>
      <p class="text-sm text-muted" id="news-save-error" hidden></p>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-secondary" id="save-news-draft">Enregistrer brouillon</button>
        <button class="btn btn-primary" id="save-news-publish">${editing ? 'Mettre à jour' : 'Publier'}</button>
      </div>
    `;

    document.getElementById('back-news').addEventListener('click', () => loadNews(container));
    document.getElementById('save-news-draft').addEventListener('click', () => saveNews(container, 'draft'));
    document.getElementById('save-news-publish').addEventListener('click', () => saveNews(container, document.getElementById('news-status').value));
  }

  async function saveNews(container, status) {
    const dateVal = document.getElementById('news-date').value;
    const data = {
      title: document.getElementById('news-title').value,
      slug: document.getElementById('news-slug').value,
      summary: document.getElementById('news-summary').value,
      content: document.getElementById('news-content').value,
      featured_image: document.getElementById('news-image').value,
      video_url: document.getElementById('news-video').value,
      category: document.getElementById('news-category').value,
      status,
      is_featured: document.getElementById('news-featured').checked,
      published_at: dateVal ? new Date(dateVal).toISOString() : (status === 'published' ? new Date().toISOString() : null),
      seo_title: document.getElementById('news-seo-title').value,
      seo_description: document.getElementById('news-seo-desc').value,
    };

    if (!data.title || data.title.trim().length < 5) {
      const err = document.getElementById('news-save-error');
      err.hidden = false;
      err.textContent = 'Le titre doit contenir au moins 5 caractères.';
      return;
    }

    const btn = document.getElementById('save-news-publish');
    btn.disabled = true;

    const res = editing
      ? await App.api(`/news/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) })
      : await App.api('/news', { method: 'POST', body: JSON.stringify(data) });

    btn.disabled = false;

    if (!res || res.error) {
      const err = document.getElementById('news-save-error');
      err.hidden = false;
      err.textContent = (res && (res.error ? `${res.error}${res.details ? ' : ' + res.details.join(', ') : ''}` : null)) || 'Erreur de connexion au serveur.';
      return;
    }

    editing = null;
    loadNews(container);
  }

  App.registerPage('news', async function (container) {
    editing = null;
    currentFilter = 'all';
    searchQuery = '';
    loadNews(container);
  });
})();
