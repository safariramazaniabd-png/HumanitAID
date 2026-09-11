/* =========================================
   HumanitAID Admin — Publications
   ========================================= */

(function () {
  const DEMO_PUBS = [
    { id: 1, title: 'Crise humanitaire en RDC : état des lieux', slug: 'crise-humanitaire-rdc-etat-lieux', summary: 'Panorama de la situation humanitaire dans les provinces orientales de la RDC.', content: 'La République Démocratique du Congo fait face à une crise humanitaire majeure depuis plusieurs années. Les provinces du Nord-Kivu, Sud-Kivu et Ituri sont les plus touchées par les conflits armés et les déplacements forcés de populations.', image: '', category: 'Urgence', status: 'published', featured: true, date: '2026-09-01', seo_title: 'Crise RDC HumanitAID', seo_desc: 'État de la crise humanitaire en RDC' },
    { id: 2, title: 'Campagne d\'eau potable : résultats du trimestre', slug: 'campagne-eau-potable-resultats', summary: 'Les résultats de notre programme d\'accès à l\'eau potable dans le Sud-Kivu.', content: 'Au cours du dernier trimestre, notre programme a permis de fournir de l\'eau potable à plus de 35 000 personnes dans les zones rurales du Sud-Kivu.', image: '', category: 'Rapport', status: 'published', featured: false, date: '2026-08-28', seo_title: 'Eau potable RDC', seo_desc: 'Résultats programme eau' },
    { id: 3, title: 'Écoles temporaires : un espoir pour 2 400 enfants', slug: 'ecoles-temporaires-espoir-enfants', summary: 'Mise en place d\'écoles temporaires pour les enfants déplacés.', content: 'HumanitAID a ouvert 12 écoles temporaires dans les camps de déplacés, offrant un enseignement à 2 400 enfants qui n\'avaient plus accès à l\'éducation.', image: '', category: 'Terrain', status: 'published', featured: true, date: '2026-08-20', seo_title: 'Écoles temporaires RDC', seo_desc: 'Éducation enfants déplacés' },
    { id: 4, title: 'Appel aux dons : urgence alimentaire', slug: 'appel-dons-urgence-alimentaire', summary: 'L\'insécurité alimentaire touche 27 millions de personnes en RDC.', content: 'Face à l\'aggravation de la crise alimentaire, HumanitAID lance un appel urgent pour fournir des rations alimentaires aux familles les plus vulnérables.', image: '', category: 'Urgence', status: 'draft', featured: false, date: '2026-09-03', seo_title: 'Urgence alimentaire RDC', seo_desc: 'Appel aux dons alimentation' },
    { id: 5, title: 'Partenariat avec l\'ONU : nuevo acuerdo', slug: 'partenariat-onu-nuevo-acuerdo', summary: 'Signature d\'un accord de coopération avec le PAM.', content: 'HumanitAID a signé un accord de coopération avec le Programme Alimentaire Mondial pour renforcer la distribution alimentaire dans les zones difficiles d\'accès.', image: '', category: 'Partenariat', status: 'scheduled', featured: false, date: '2026-09-10', seo_title: 'Partenariat PAM', seo_desc: 'Coopération HumanitAID PAM' },
    { id: 6, title: 'Témoignage d\'une infirmière de terrain', slug: 'temoinage-infirmiere-terrain', summary: 'Sandra raconte son expérience dans un centre de santé du Nord-Kivu.', content: '« Chaque jour, nous recevons des dizaines de patients. Les blessures par armes à feu sont malheureusement très fréquentes. Mais nous ne lâchons rien. »', image: '', category: 'Témoignage', status: 'archived', featured: false, date: '2026-07-15', seo_title: 'Témoignage infirmière', seo_desc: 'Récit terrain RDC' }
  ];

  let pubs = [...DEMO_PUBS];
  let currentFilter = 'all';
  let searchQuery = '';
  let editingPub = null;

  function filtered() {
    let list = pubs;
    if (currentFilter !== 'all') list = list.filter(p => p.status === currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return list;
  }

  function renderList(container) {
    const statusCounts = { all: pubs.length, published: pubs.filter(p => p.status === 'published').length, draft: pubs.filter(p => p.status === 'draft').length, scheduled: pubs.filter(p => p.status === 'scheduled').length, archived: pubs.filter(p => p.status === 'archived').length };

    container.innerHTML = `
      <div class="section-header">
        <h2>Publications <span class="demo-badge">DEMO</span></h2>
        <button class="btn btn-primary" id="new-pub-btn">+ Nouvelle publication</button>
      </div>
      <div class="tabs">
        <button class="tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Toutes (${statusCounts.all})</button>
        <button class="tab ${currentFilter === 'published' ? 'active' : ''}" data-filter="published">Publiées (${statusCounts.published})</button>
        <button class="tab ${currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">Brouillons (${statusCounts.draft})</button>
        <button class="tab ${currentFilter === 'scheduled' ? 'active' : ''}" data-filter="scheduled">Planifiées (${statusCounts.scheduled})</button>
        <button class="tab ${currentFilter === 'archived' ? 'active' : ''}" data-filter="archived">Archivées (${statusCounts.archived})</button>
      </div>
      <div class="toolbar">
        <div class="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Rechercher..." id="pub-search" value="${searchQuery}">
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered().map(p => `
              <tr>
                <td><strong>${p.title}</strong>${p.featured ? ' ⭐' : ''}</td>
                <td><span class="badge badge-info">${p.category}</span></td>
                <td>${App.statusBadge(p.status)}</td>
                <td>${App.formatDate(p.date)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-pub" data-id="${p.id}">Modifier</button>
                  <button class="btn btn-ghost btn-sm delete-pub" data-id="${p.id}">Supprimer</button>
                </td>
              </tr>
            `).join('')}
            ${filtered().length === 0 ? '<tr><td colspan="5" class="text-muted" style="text-align:center;padding:40px;">Aucune publication trouvée</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { currentFilter = t.dataset.filter; renderList(container); });
    });

    document.getElementById('pub-search').addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderList(container);
    });

    document.getElementById('new-pub-btn').addEventListener('click', () => {
      editingPub = null;
      renderForm(container);
    });

    container.querySelectorAll('.edit-pub').forEach(btn => {
      btn.addEventListener('click', () => {
        editingPub = pubs.find(p => p.id === parseInt(btn.dataset.id));
        renderForm(container);
      });
    });

    container.querySelectorAll('.delete-pub').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer cette publication ?', () => {
          pubs = pubs.filter(p => p.id !== parseInt(btn.dataset.id));
          renderList(container);
        });
      });
    });
  }

  function renderForm(container) {
    const p = editingPub || { title: '', slug: '', summary: '', content: '', image: '', category: 'Urgence', status: 'draft', featured: false, date: new Date().toISOString().split('T')[0], seo_title: '', seo_desc: '' };

    container.innerHTML = `
      <div class="section-header">
        <h2>${editingPub ? 'Modifier' : 'Nouvelle'} publication</h2>
        <button class="btn btn-secondary" id="back-to-list">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu</div>
        <div class="form-group">
          <label>Titre</label>
          <input type="text" id="pub-title" value="${p.title}">
        </div>
        <div class="form-group">
          <label>Slug</label>
          <input type="text" id="pub-slug" value="${p.slug}">
        </div>
        <div class="form-group">
          <label>Résumé</label>
          <textarea id="pub-summary" rows="3">${p.summary}</textarea>
        </div>
        <div class="form-group">
          <label>Contenu</label>
          <textarea id="pub-content" rows="10" style="max-height:400px;">${p.content}</textarea>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média</div>
        <div class="form-group">
          <label>Image à la une (URL)</label>
          <input type="url" id="pub-image" value="${p.image}" placeholder="https://...">
        </div>
        <div class="form-group">
          <label>Vidéo (URL)</label>
          <input type="url" id="pub-video" placeholder="https://youtube.com/...">
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Paramètres</div>
        <div class="form-row">
          <div class="form-group">
            <label>Catégorie</label>
            <select id="pub-category">
              <option ${p.category === 'Urgence' ? 'selected' : ''}>Urgence</option>
              <option ${p.category === 'Terrain' ? 'selected' : ''}>Terrain</option>
              <option ${p.category === 'Témoignage' ? 'selected' : ''}>Témoignage</option>
              <option ${p.category === 'Rapport' ? 'selected' : ''}>Rapport</option>
              <option ${p.category === 'Partenariat' ? 'selected' : ''}>Partenariat</option>
              <option ${p.category === 'Plaidoyer' ? 'selected' : ''}>Plaidoyer</option>
            </select>
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select id="pub-status">
              <option value="draft" ${p.status === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="published" ${p.status === 'published' ? 'selected' : ''}>Publié</option>
              <option value="scheduled" ${p.status === 'scheduled' ? 'selected' : ''}>Planifié</option>
              <option value="archived" ${p.status === 'archived' ? 'selected' : ''}>Archivé</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date de publication</label>
            <input type="date" id="pub-date" value="${p.date}">
          </div>
          <div class="form-check" style="margin-top:24px;">
            <input type="checkbox" id="pub-featured" ${p.featured ? 'checked' : ''}>
            <label for="pub-featured">Article à la une</label>
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">SEO</div>
        <div class="form-group">
          <label>Titre SEO</label>
          <input type="text" id="pub-seo-title" value="${p.seo_title}">
        </div>
        <div class="form-group">
          <label>Description SEO</label>
          <textarea id="pub-seo-desc" rows="2">${p.seo_desc}</textarea>
        </div>
      </div>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-secondary" id="save-draft-btn">Enregistrer brouillon</button>
        <button class="btn btn-primary" id="publish-btn">${editingPub ? 'Mettre à jour' : 'Publier'}</button>
      </div>
    `;

    document.getElementById('pub-title').addEventListener('input', (e) => {
      if (!editingPub) {
        document.getElementById('pub-slug').value = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    });

    document.getElementById('back-to-list').addEventListener('click', () => renderList(container));
    document.getElementById('save-draft-btn').addEventListener('click', () => savePub(container, 'draft'));
    document.getElementById('publish-btn').addEventListener('click', () => savePub(container, document.getElementById('pub-status').value));
  }

  function savePub(container, status) {
    const data = {
      title: document.getElementById('pub-title').value,
      slug: document.getElementById('pub-slug').value,
      summary: document.getElementById('pub-summary').value,
      content: document.getElementById('pub-content').value,
      image: document.getElementById('pub-image').value,
      category: document.getElementById('pub-category').value,
      status: status,
      featured: document.getElementById('pub-featured').checked,
      date: document.getElementById('pub-date').value,
      seo_title: document.getElementById('pub-seo-title').value,
      seo_desc: document.getElementById('pub-seo-desc').value
    };

    if (editingPub) {
      Object.assign(editingPub, data);
    } else {
      data.id = Math.max(0, ...pubs.map(p => p.id)) + 1;
      pubs.push(data);
    }
    editingPub = null;
    renderList(container);
  }

  App.registerPage('publications', function (container) {
    editingPub = null;
    currentFilter = 'all';
    searchQuery = '';
    renderList(container);
  });
})();
