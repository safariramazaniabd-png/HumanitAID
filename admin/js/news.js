/* =========================================
   HumanitAID Admin — News
   ========================================= */

(function () {
  const DEMO_NEWS = [
    { id: 1, title: 'Urgence alimentaire : 27 millions de personnes en danger', slug: 'urgence-alimentaire-27-millions', summary: 'L\'insécurité alimentaire aiguë touche un nombre record de personnes en RDC.', content: 'Selon les dernières estimations, 27,3 millions de personnes en RDC sont en insécurité alimentaire aiguë, soit environ un quart de la population. Les conflits armés, les déplacements massifs et les effets du changement climatique aggravent la situation.', image: '', category: 'Urgence', status: 'published', featured: true, date: '2026-09-03', author: 'Rédaction HumanitAID', seo_title: 'Urgence alimentaire RDC 2026', seo_desc: '27 millions en insécurité alimentaire' },
    { id: 2, title: 'Nouveau centre de santé opérationnel à Beni', slug: 'nouveau-centre-sante-beni', summary: 'HumanitAID inaugure un centre de santé equipé pour servir 15 000 personnes.', content: 'Le nouveau centre de santé de Beni, financé par HumanitAID et ses partenaires, est désormais opérationnel. Il dispose de trois salles de consultation, d\'un laboratoire et d\'une pharmacie.', image: '', category: 'Terrain', status: 'published', featured: false, date: '2026-08-29', author: 'Dr. Samuel Lukusa', seo_title: 'Centre santé Beni HumanitAID', seo_desc: 'Nouveau centre de santé Beni' },
    { id: 3, title: 'Témoignage : « Nous avons tout perdu, mais pas l\'espoir »', slug: 'temoinage-tout-perdu-espoir', summary: 'Marie, mère de 5 enfants déplacée de Bunia, raconte son calvaire.', content: '« La nuit où les combattants sont arrivés, nous avons couru sans regarder en arrière. Mon mari a été séparé de nous. Depuis, je ne l\'ai plus revu. Mais je garde espoir grâce à l\'aide que nous recevons. »', image: '', category: 'Témoignage', status: 'published', featured: true, date: '2026-08-22', author: 'Nadia Kasongo', seo_title: 'Témoignage déplacés RDC', seo_desc: 'Récit d\'une mère déplacée' },
    { id: 4, title: 'Appel à la communauté internationale', slug: 'appel-communaute-internationale', summary: 'HumanitAID lance un appel pour mobiliser les ressources face à la crise.', content: 'La situation humanitaire en RDC nécessite une réponse à la hauteur de l\'urgence. HumanitAID appelle la communauté internationale à augmenter les financements et à œuvrer pour la paix.', image: '', category: 'Plaidoyer', status: 'draft', featured: false, date: '2026-09-01', author: 'Direction HumanitAID', seo_title: 'Appel RDC HumanitAID', seo_desc: 'Plaidoyer crise RDC' }
  ];

  let news = [...DEMO_NEWS];
  let currentFilter = 'all';
  let searchQuery = '';
  let editing = null;

  function filtered() {
    let list = news;
    if (currentFilter !== 'all') list = list.filter(n => n.status === currentFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n => n.title.toLowerCase().includes(q) || n.category.toLowerCase().includes(q));
    }
    return list;
  }

  function renderList(container) {
    const counts = { all: news.length, published: news.filter(n => n.status === 'published').length, draft: news.filter(n => n.status === 'draft').length };

    container.innerHTML = `
      <div class="section-header">
        <h2>Actualités <span class="demo-badge">DEMO</span></h2>
        <button class="btn btn-primary" id="new-news-btn">+ Nouvelle actualité</button>
      </div>
      <div class="tabs">
        <button class="tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Toutes (${counts.all})</button>
        <button class="tab ${currentFilter === 'published' ? 'active' : ''}" data-filter="published">Publiées (${counts.published})</button>
        <button class="tab ${currentFilter === 'draft' ? 'active' : ''}" data-filter="draft">Brouillons (${counts.draft})</button>
      </div>
      <div class="toolbar">
        <div class="toolbar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Rechercher..." id="news-search" value="${searchQuery}">
        </div>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Catégorie</th>
              <th>Auteur</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered().map(n => `
              <tr>
                <td><strong>${n.title}</strong>${n.featured ? ' ⭐' : ''}</td>
                <td><span class="badge badge-info">${n.category}</span></td>
                <td class="text-muted">${n.author}</td>
                <td>${App.statusBadge(n.status)}</td>
                <td>${App.formatDate(n.date)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-news" data-id="${n.id}">Modifier</button>
                  <button class="btn btn-ghost btn-sm delete-news" data-id="${n.id}">Supprimer</button>
                </td>
              </tr>
            `).join('')}
            ${filtered().length === 0 ? '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:40px;">Aucune actualité</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { currentFilter = t.dataset.filter; renderList(container); });
    });
    document.getElementById('news-search').addEventListener('input', (e) => { searchQuery = e.target.value; renderList(container); });
    document.getElementById('new-news-btn').addEventListener('click', () => { editing = null; renderForm(container); });

    container.querySelectorAll('.edit-news').forEach(btn => {
      btn.addEventListener('click', () => { editing = news.find(n => n.id === parseInt(btn.dataset.id)); renderForm(container); });
    });
    container.querySelectorAll('.delete-news').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer cette actualité ?', () => {
          news = news.filter(n => n.id !== parseInt(btn.dataset.id));
          renderList(container);
        });
      });
    });
  }

  function renderForm(container) {
    const n = editing || { title: '', slug: '', summary: '', content: '', image: '', category: 'Urgence', status: 'draft', featured: false, date: new Date().toISOString().split('T')[0], author: 'Rédaction HumanitAID', seo_title: '', seo_desc: '' };

    container.innerHTML = `
      <div class="section-header">
        <h2>${editing ? 'Modifier' : 'Nouvelle'} actualité</h2>
        <button class="btn btn-secondary" id="back-news">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu</div>
        <div class="form-group"><label>Titre</label><input type="text" id="news-title" value="${n.title}"></div>
        <div class="form-group"><label>Slug</label><input type="text" id="news-slug" value="${n.slug}"></div>
        <div class="form-group"><label>Résumé</label><textarea id="news-summary" rows="3">${n.summary}</textarea></div>
        <div class="form-group"><label>Contenu</label><textarea id="news-content" rows="10" style="max-height:400px;">${n.content}</textarea></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média</div>
        <div class="form-group"><label>Image (URL)</label><input type="url" id="news-image" value="${n.image}"></div>
        <div class="form-group"><label>Vidéo (URL)</label><input type="url" id="news-video" placeholder="https://..."></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Paramètres</div>
        <div class="form-row">
          <div class="form-group">
            <label>Catégorie</label>
            <select id="news-category">
              <option ${n.category === 'Urgence' ? 'selected' : ''}>Urgence</option>
              <option ${n.category === 'Terrain' ? 'selected' : ''}>Terrain</option>
              <option ${n.category === 'Témoignage' ? 'selected' : ''}>Témoignage</option>
              <option ${n.category === 'Plaidoyer' ? 'selected' : ''}>Plaidoyer</option>
              <option ${n.category === 'Partenariat' ? 'selected' : ''}>Partenariat</option>
              <option ${n.category === 'Rapport' ? 'selected' : ''}>Rapport</option>
            </select>
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select id="news-status">
              <option value="draft" ${n.status === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="published" ${n.status === 'published' ? 'selected' : ''}>Publié</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Auteur</label><input type="text" id="news-author" value="${n.author}"></div>
          <div class="form-group"><label>Date</label><input type="date" id="news-date" value="${n.date}"></div>
        </div>
        <div class="form-check">
          <input type="checkbox" id="news-featured" ${n.featured ? 'checked' : ''}>
          <label for="news-featured">Article à la une</label>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">SEO</div>
        <div class="form-group"><label>Titre SEO</label><input type="text" id="news-seo-title" value="${n.seo_title}"></div>
        <div class="form-group"><label>Description SEO</label><textarea id="news-seo-desc" rows="2">${n.seo_desc}</textarea></div>
      </div>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-secondary" id="save-news-draft">Enregistrer brouillon</button>
        <button class="btn btn-primary" id="save-news-publish">Publier</button>
      </div>
    `;

    document.getElementById('news-title').addEventListener('input', (e) => {
      if (!editing) document.getElementById('news-slug').value = e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    });

    document.getElementById('back-news').addEventListener('click', () => renderList(container));
    document.getElementById('save-news-draft').addEventListener('click', () => saveNews(container, 'draft'));
    document.getElementById('save-news-publish').addEventListener('click', () => saveNews(container, 'published'));
  }

  function saveNews(container, status) {
    const data = {
      title: document.getElementById('news-title').value,
      slug: document.getElementById('news-slug').value,
      summary: document.getElementById('news-summary').value,
      content: document.getElementById('news-content').value,
      image: document.getElementById('news-image').value,
      category: document.getElementById('news-category').value,
      status, featured: document.getElementById('news-featured').checked,
      date: document.getElementById('news-date').value,
      author: document.getElementById('news-author').value,
      seo_title: document.getElementById('news-seo-title').value,
      seo_desc: document.getElementById('news-seo-desc').value
    };
    if (editing) Object.assign(editing, data);
    else { data.id = Math.max(0, ...news.map(n => n.id)) + 1; news.push(data); }
    editing = null;
    renderList(container);
  }

  App.registerPage('news', function (container) { editing = null; currentFilter = 'all'; searchQuery = ''; renderList(container); });
})();
