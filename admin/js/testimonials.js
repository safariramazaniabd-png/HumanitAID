/* =========================================
   HumanitAID Admin — Témoignages
   Branché sur l'API réelle (frontend/api/testimonials/).
   ========================================= */

(function () {
  let items = [];
  let catFilter = 'all';
  let editing = null;
  let loadError = null;

  const CAT_LABELS = { Beneficiary: 'Bénéficiaire', Volunteer: 'Bénévole', Donor: 'Donateur', Partner: 'Partenaire', 'Field Worker': 'Agent de terrain' };

  async function loadTestimonials(container) {
    container.innerHTML = '<div class="section-header"><h2>Témoignages</h2></div><p class="text-muted">Chargement…</p>';
    const qs = new URLSearchParams();
    qs.set('limit', '100');
    if (catFilter !== 'all') qs.set('category', catFilter);

    const data = await App.api(`/testimonials?${qs.toString()}`);
    if (!data || !data.testimonials) {
      loadError = true;
      items = [];
    } else {
      loadError = false;
      items = data.testimonials;
    }
    renderList(container);
  }

  function renderList(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header"><h2>Témoignages</h2></div>
        <p class="text-muted">Impossible de charger les témoignages depuis le serveur. Vérifiez la connexion à l'API.</p>
        <button class="btn btn-secondary" id="retry-test">Réessayer</button>
      `;
      document.getElementById('retry-test').addEventListener('click', () => loadTestimonials(container));
      return;
    }

    const cats = {};
    items.forEach(t => { if (t.category) cats[t.category] = (cats[t.category] || 0) + 1; });

    container.innerHTML = `
      <div class="section-header">
        <h2>Témoignages</h2>
        <button class="btn btn-primary" id="new-test-btn">+ Nouveau témoignage</button>
      </div>
      <div class="tabs">
        <button class="tab ${catFilter === 'all' ? 'active' : ''}" data-cat="all">Tous</button>
        ${Object.keys(cats).map(c => `<button class="tab ${catFilter === c ? 'active' : ''}" data-cat="${escHtml(c)}">${escHtml(CAT_LABELS[c] || c)} (${cats[c]})</button>`).join('')}
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr><th>Auteur</th><th>Catégorie</th><th>Localisation</th><th>Extrait</th><th>Statut</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${items.map(t => `
              <tr>
                <td><strong>${escHtml(t.author_name)}</strong></td>
                <td>${t.category ? `<span class="badge badge-gold">${escHtml(CAT_LABELS[t.category] || t.category)}</span>` : ''}</td>
                <td class="text-muted">${escHtml(t.location || '')}</td>
                <td class="text-muted" style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(t.content)}</td>
                <td>${App.statusBadge(t.status)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-test" data-id="${t.id}">Modifier</button>
                  <button class="btn btn-ghost btn-sm delete-test" data-id="${t.id}">Supprimer</button>
                </td>
              </tr>
            `).join('')}
            ${items.length === 0 ? '<tr><td colspan="6" class="text-muted" style="text-align:center;padding:40px;">Aucun témoignage</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { catFilter = t.dataset.cat; loadTestimonials(container); });
    });
    document.getElementById('new-test-btn').addEventListener('click', () => { editing = null; renderForm(container); });
    container.querySelectorAll('.edit-test').forEach(btn => {
      btn.addEventListener('click', () => { editing = items.find(t => t.id === btn.dataset.id); renderForm(container); });
    });
    container.querySelectorAll('.delete-test').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer définitivement ce témoignage ? Cette action est irréversible.', async () => {
          await App.api(`/testimonials/${btn.dataset.id}`, { method: 'DELETE' });
          loadTestimonials(container);
        });
      });
    });
  }

  function renderForm(container) {
    const t = editing || { author_name: '', category: 'Beneficiary', location: '', content: '', photo_url: '', video_url: '', status: 'draft', display_order: 0 };

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
          <div class="form-group"><label>Nom de l'auteur</label><input type="text" id="test-author" value="${escHtml(t.author_name)}"></div>
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
        <div class="form-group"><label>Localisation</label><input type="text" id="test-location" value="${escHtml(t.location || '')}"></div>
        <div class="form-group"><label>Témoignage</label><textarea id="test-content" rows="6">${escHtml(t.content)}</textarea></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média</div>
        <div class="form-group"><label>Photo (URL)</label><input type="url" id="test-photo" value="${escHtml(t.photo_url || '')}" placeholder="https://..."></div>
        <div class="form-group"><label>Vidéo (URL)</label><input type="url" id="test-video" value="${escHtml(t.video_url || '')}" placeholder="https://..."></div>
      </div>
      <div class="form-section">
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="test-status">
              <option value="draft" ${t.status === 'draft' ? 'selected' : ''}>Brouillon</option>
              <option value="published" ${t.status === 'published' ? 'selected' : ''}>Publié</option>
              <option value="archived" ${t.status === 'archived' ? 'selected' : ''}>Archivé</option>
            </select>
          </div>
          <div class="form-group"><label>Ordre d'affichage</label><input type="number" id="test-order" value="${t.display_order || 0}"></div>
        </div>
      </div>
      <p class="text-sm text-muted" id="test-save-error" hidden></p>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-test-btn">${editing ? 'Mettre à jour' : 'Enregistrer'}</button>
      </div>
    `;

    document.getElementById('back-test').addEventListener('click', () => loadTestimonials(container));
    document.getElementById('save-test-btn').addEventListener('click', async () => {
      const data = {
        author_name: document.getElementById('test-author').value,
        category: document.getElementById('test-category').value,
        location: document.getElementById('test-location').value,
        content: document.getElementById('test-content').value,
        photo_url: document.getElementById('test-photo').value,
        video_url: document.getElementById('test-video').value,
        status: document.getElementById('test-status').value,
        display_order: parseInt(document.getElementById('test-order').value, 10) || 0,
      };

      if (!data.author_name || data.author_name.trim().length < 2) {
        const err = document.getElementById('test-save-error');
        err.hidden = false;
        err.textContent = 'Le nom doit contenir au moins 2 caractères.';
        return;
      }
      if (!data.content || data.content.trim().length < 10) {
        const err = document.getElementById('test-save-error');
        err.hidden = false;
        err.textContent = 'Le témoignage doit contenir au moins 10 caractères.';
        return;
      }

      const btn = document.getElementById('save-test-btn');
      btn.disabled = true;

      const res = editing
        ? await App.api(`/testimonials/${editing.id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await App.api('/testimonials', { method: 'POST', body: JSON.stringify(data) });

      btn.disabled = false;

      if (!res || res.error) {
        const err = document.getElementById('test-save-error');
        err.hidden = false;
        err.textContent = (res && (res.error ? `${res.error}${res.details ? ' : ' + res.details.join(', ') : ''}` : null)) || 'Erreur de connexion au serveur.';
        return;
      }

      editing = null;
      loadTestimonials(container);
    });
  }

  App.registerPage('testimonials', async function (container) {
    editing = null;
    catFilter = 'all';
    loadTestimonials(container);
  });
})();
