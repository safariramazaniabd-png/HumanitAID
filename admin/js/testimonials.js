/* =========================================
   HumanitAID Admin — Testimonials
   ========================================= */

(function () {
  const DEMO_TESTIMONIALS = [
    { id: 1, author_name: 'Marie Kabila', category: 'Beneficiary', location: 'Goma, Nord-Kivu', content: 'HumanitAID nous a fourni de l\'eau potable et des médicaments quand personne ne venait nous aider. Mes enfants sont enfin en sécurité.', photo: '', video: '', status: 'published' },
    { id: 2, author_name: 'Jean Mutombo', category: 'Volunteer', location: 'Bukavu, Sud-Kivu', content: 'En tant que bénévole, j\'ai vu de près l\'impact de HumanitAID. Les équipes sont professionnelles et vraiment dévouées.', photo: '', video: '', status: 'published' },
    { id: 3, author_name: 'Claire Dubois', category: 'Donor', location: 'Paris, France', content: 'Je donne chaque mois à HumanitAID parce que je sais que l\'argent va directement sur le terrain. C\'est une organisation transparente.', photo: '', video: '', status: 'published' },
    { id: 4, author_name: 'Dr. Samuel Lukusa', category: 'Field Worker', location: 'Beni, Nord-Kivu', content: 'Au centre de santé que HumanitAID soutient, nous traitons plus de 200 patients par jour. Sans ce soutien, des vies seraient perdues.', photo: '', video: '', status: 'published' },
    { id: 5, author_name: 'Grâce Nsimire', category: 'Beneficiary', location: 'Minova, Sud-Kivu', content: 'Grâce à l\'école temporaire, ma fille a pu reprendre les cours. Elle veut devenir médecin pour aider son village.', photo: '', video: '', status: 'draft' },
    { id: 6, author_name: 'Oxfam RDC', category: 'Partner', location: 'Kinshasa', content: 'Notre partenariat avec HumanitAID a permis de renforcer la réponse humanitaire dans trois provinces. Une collaboration exemplaire.', photo: '', video: '', status: 'published' }
  ];

  let testimonials = [...DEMO_TESTIMONIALS];
  let catFilter = 'all';
  let editing = null;

  const CAT_LABELS = { Beneficiary: 'Bénéficiaire', Volunteer: 'Bénévole', Donor: 'Donateur', Partner: 'Partenaire', 'Field Worker': 'Agent de terrain' };

  function filtered() {
    if (catFilter === 'all') return testimonials;
    return testimonials.filter(t => t.category === catFilter);
  }

  function renderList(container) {
    const cats = {};
    testimonials.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });

    container.innerHTML = `
      <div class="section-header">
        <h2>Témoignages <span class="demo-badge">DEMO</span></h2>
        <button class="btn btn-primary" id="new-test-btn">+ Nouveau témoignage</button>
      </div>
      <div class="tabs">
        <button class="tab ${catFilter === 'all' ? 'active' : ''}" data-cat="all">Tous (${testimonials.length})</button>
        ${Object.keys(cats).map(c => `<button class="tab ${catFilter === c ? 'active' : ''}" data-cat="${c}">${CAT_LABELS[c] || c} (${cats[c]})</button>`).join('')}
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Auteur</th>
              <th>Catégorie</th>
              <th>Localisation</th>
              <th>Extrait</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered().map(t => `
              <tr>
                <td><strong>${t.author_name}</strong></td>
                <td><span class="badge badge-gold">${CAT_LABELS[t.category] || t.category}</span></td>
                <td class="text-muted">${t.location}</td>
                <td class="text-muted" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.content}</td>
                <td>${App.statusBadge(t.status)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-test" data-id="${t.id}">Modifier</button>
                  <button class="btn btn-ghost btn-sm delete-test" data-id="${t.id}">Supprimer</button>
                </td>
              </tr>
            `).join('')}
            ${filtered().length === 0 ? '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:40px;">Aucun témoignage</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { catFilter = t.dataset.cat; renderList(container); });
    });
    document.getElementById('new-test-btn').addEventListener('click', () => { editing = null; renderForm(container); });
    container.querySelectorAll('.edit-test').forEach(btn => {
      btn.addEventListener('click', () => { editing = testimonials.find(t => t.id === parseInt(btn.dataset.id)); renderForm(container); });
    });
    container.querySelectorAll('.delete-test').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer ce témoignage ?', () => {
          testimonials = testimonials.filter(t => t.id !== parseInt(btn.dataset.id));
          renderList(container);
        });
      });
    });
  }

  function renderForm(container) {
    const t = editing || { author_name: '', category: 'Beneficiary', location: '', content: '', photo: '', video: '', status: 'draft' };

    container.innerHTML = `
      <div class="section-header">
        <h2>${editing ? 'Modifier' : 'Nouveau'} témoignage</h2>
        <button class="btn btn-secondary" id="back-test">← Retour</button>
      </div>
      <div class="form-section">
        <div style="background:rgba(243,156,18,0.1);border:1px solid rgba(243,156,18,0.3);border-radius:var(--radius);padding:12px 16px;margin-bottom:20px;font-size:13px;color:var(--warning);display:flex;gap:10px;align-items:flex-start;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0;margin-top:1px;"><path d="M10.3 3.8L2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>
          <span>Protéger les bénéficiaires — ne jamais exposer d'informations sensibles (noms complets, adresses précises, photos identifiables sans consentement).</span>
        </div>
        <div class="form-section-title">Informations</div>
        <div class="form-row">
          <div class="form-group"><label>Nom de l'auteur</label><input type="text" id="test-author" value="${t.author_name}"></div>
          <div class="form-group">
            <label>Catégorie</label>
            <select id="test-category">
              <option value="Beneficiary" ${t.category === 'Beneficiary' ? 'selected' : ''}>Bénéficiaire</option>
              <option value="Volunteer" ${t.category === 'Volunteer' ? 'selected' : ''}>Bénévole</option>
              <option value="Donor" ${t.category === 'Donor' ? 'selected' : ''}>Donateur</option>
              <option value="Partner" ${t.category === 'Partner' ? 'selected' : ''}>Partenaire</option>
              <option value="Field Worker" ${t.category === 'Field Worker' ? 'selected' : ''}>Agent de terrain</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>Localisation</label><input type="text" id="test-location" value="${t.location}"></div>
        <div class="form-group"><label>Témoignage</label><textarea id="test-content" rows="6">${t.content}</textarea></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média</div>
        <div class="form-group"><label>Photo (URL)</label><input type="url" id="test-photo" value="${t.photo}" placeholder="https://..."></div>
        <div class="form-group"><label>Vidéo (URL)</label><input type="url" id="test-video" value="${t.video}" placeholder="https://..."></div>
      </div>
      <div class="form-section">
        <div class="form-group">
          <label>Statut</label>
          <select id="test-status">
            <option value="draft" ${t.status === 'draft' ? 'selected' : ''}>Brouillon</option>
            <option value="published" ${t.status === 'published' ? 'selected' : ''}>Publié</option>
          </select>
        </div>
      </div>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-test-btn">${editing ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    `;

    document.getElementById('back-test').addEventListener('click', () => renderList(container));
    document.getElementById('save-test-btn').addEventListener('click', () => {
      const data = {
        author_name: document.getElementById('test-author').value,
        category: document.getElementById('test-category').value,
        location: document.getElementById('test-location').value,
        content: document.getElementById('test-content').value,
        photo: document.getElementById('test-photo').value,
        video: document.getElementById('test-video').value,
        status: document.getElementById('test-status').value
      };
      if (editing) Object.assign(editing, data);
      else { data.id = Math.max(0, ...testimonials.map(t => t.id)) + 1; testimonials.push(data); }
      editing = null;
      renderList(container);
    });
  }

  App.registerPage('testimonials', function (container) { editing = null; catFilter = 'all'; renderList(container); });
})();
