/* =========================================
   HumanitAID Admin — Diaporamas
   Branché sur l'API réelle (frontend/api/slides/).
   ========================================= */

(function () {
  let activeTab = 'hero'; // 'hero' | 'field_story' — valeurs réelles de l'ENUM slide_type
  let slides = [];
  let editingSlide = null;
  let loadError = null;

  async function loadSlides(container) {
    container.innerHTML = '<div class="section-header"><h2>Diaporamas</h2></div><p class="text-muted">Chargement…</p>';
    const data = await App.api(`/slides?type=${activeTab}`);
    if (!data || !data.slides) {
      loadError = true;
      slides = [];
    } else {
      loadError = false;
      slides = data.slides;
    }
    render(container);
  }

  function render(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header"><h2>Diaporamas</h2></div>
        <p class="text-muted">Impossible de charger les slides depuis le serveur. Vérifiez la connexion à l'API.</p>
        <button class="btn btn-secondary" id="retry-slides">Réessayer</button>
      `;
      document.getElementById('retry-slides').addEventListener('click', () => loadSlides(container));
      return;
    }

    const sorted = [...slides].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    container.innerHTML = `
      <div class="section-header">
        <h2>Diaporamas</h2>
        <button class="btn btn-primary" id="add-slide-btn">+ Nouveau slide</button>
      </div>
      <div class="tabs">
        <button class="tab ${activeTab === 'hero' ? 'active' : ''}" data-tab="hero">Hero Slides</button>
        <button class="tab ${activeTab === 'field_story' ? 'active' : ''}" data-tab="field_story">Field Stories</button>
      </div>
      <div class="slide-list">
        ${sorted.map(s => `
          <div class="slide-item" data-id="${s.id}">
            <span class="slide-order">${s.display_order ?? ''}</span>
            <div class="slide-thumb">${s.image_url ? `<img src="${escHtml(s.image_url)}" alt="">` : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>'}</div>
            <div class="slide-info">
              <h4>${escHtml(s.title)}</h4>
              <p>${escHtml(s.subtitle || '')}</p>
            </div>
            ${App.statusBadge(s.is_active ? 'active' : 'inactive')}
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm edit-slide" data-id="${s.id}">Modifier</button>
              <button class="btn btn-ghost btn-sm delete-slide" data-id="${s.id}">Supprimer</button>
            </div>
          </div>
        `).join('')}
        ${sorted.length === 0 ? '<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg></div><p>Aucun slide</p></div>' : ''}
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { activeTab = t.dataset.tab; loadSlides(container); });
    });

    document.getElementById('add-slide-btn').addEventListener('click', () => {
      editingSlide = null;
      renderForm(container);
    });

    container.querySelectorAll('.edit-slide').forEach(btn => {
      btn.addEventListener('click', () => {
        editingSlide = slides.find(s => s.id === btn.dataset.id);
        renderForm(container);
      });
    });

    container.querySelectorAll('.delete-slide').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer définitivement ce slide ? Cette action est irréversible.', async () => {
          await App.api(`/slides/${btn.dataset.id}`, { method: 'DELETE' });
          loadSlides(container);
        });
      });
    });
  }

  function renderForm(container) {
    const s = editingSlide || { title: '', subtitle: '', description: '', image_url: '', video_url: '', cta_text: '', cta_url: '', is_active: true, is_main: false, duration: 5500, display_order: slides.length + 1 };

    container.innerHTML = `
      <div class="section-header">
        <h2>${editingSlide ? 'Modifier' : 'Nouveau'} slide</h2>
        <button class="btn btn-secondary" id="back-to-slides">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu du slide</div>
        <div class="form-group"><label>Titre</label><input type="text" id="slide-title" value="${escHtml(s.title)}"></div>
        <div class="form-group"><label>Sous-titre</label><input type="text" id="slide-subtitle" value="${escHtml(s.subtitle || '')}"></div>
        <div class="form-group"><label>Description</label><textarea id="slide-desc" rows="3">${escHtml(s.description || '')}</textarea></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média et actions</div>
        <div class="form-group"><label>Image (URL)</label><input type="url" id="slide-image" value="${escHtml(s.image_url || '')}" placeholder="https://..."></div>
        <div class="form-group"><label>Vidéo (URL)</label><input type="url" id="slide-video" value="${escHtml(s.video_url || '')}" placeholder="https://..."></div>
        <div class="form-row">
          <div class="form-group"><label>Texte du bouton CTA</label><input type="text" id="slide-cta-text" value="${escHtml(s.cta_text || '')}"></div>
          <div class="form-group"><label>URL du bouton CTA</label><input type="text" id="slide-cta-url" value="${escHtml(s.cta_url || '')}"></div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Paramètres</div>
        <div class="form-row">
          <div class="form-check">
            <input type="checkbox" id="slide-active" ${s.is_active ? 'checked' : ''}>
            <label for="slide-active">Actif</label>
          </div>
          <div class="form-check">
            <input type="checkbox" id="slide-main" ${s.is_main ? 'checked' : ''}>
            <label for="slide-main">Slide principal (hero)</label>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Durée (ms)</label><input type="number" id="slide-duration" value="${s.duration}"></div>
          <div class="form-group"><label>Ordre d'affichage</label><input type="number" id="slide-order" value="${s.display_order}"></div>
        </div>
      </div>
      <p class="text-sm text-muted" id="slide-save-error" hidden></p>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-slide-btn">${editingSlide ? 'Mettre à jour' : 'Créer le slide'}</button>
      </div>
    `;

    document.getElementById('back-to-slides').addEventListener('click', () => loadSlides(container));
    document.getElementById('save-slide-btn').addEventListener('click', async () => {
      const data = {
        type: activeTab,
        title: document.getElementById('slide-title').value,
        subtitle: document.getElementById('slide-subtitle').value,
        description: document.getElementById('slide-desc').value,
        image_url: document.getElementById('slide-image').value,
        video_url: document.getElementById('slide-video').value,
        cta_text: document.getElementById('slide-cta-text').value,
        cta_url: document.getElementById('slide-cta-url').value,
        is_active: document.getElementById('slide-active').checked,
        is_main: document.getElementById('slide-main').checked,
        duration: parseInt(document.getElementById('slide-duration').value, 10),
        display_order: parseInt(document.getElementById('slide-order').value, 10),
      };

      if (!data.title || data.title.trim().length < 3) {
        const err = document.getElementById('slide-save-error');
        err.hidden = false;
        err.textContent = 'Le titre doit contenir au moins 3 caractères.';
        return;
      }

      const btn = document.getElementById('save-slide-btn');
      btn.disabled = true;

      const res = editingSlide
        ? await App.api(`/slides/${editingSlide.id}`, { method: 'PUT', body: JSON.stringify(data) })
        : await App.api('/slides', { method: 'POST', body: JSON.stringify(data) });

      btn.disabled = false;

      if (!res || res.error) {
        const err = document.getElementById('slide-save-error');
        err.hidden = false;
        err.textContent = (res && (res.error ? `${res.error}${res.details ? ' : ' + res.details.join(', ') : ''}` : null)) || 'Erreur de connexion au serveur.';
        return;
      }

      editingSlide = null;
      loadSlides(container);
    });
  }

  App.registerPage('slideshows', async function (container) {
    activeTab = 'hero';
    editingSlide = null;
    loadSlides(container);
  });
})();
