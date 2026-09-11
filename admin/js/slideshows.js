/* =========================================
   HumanitAID Admin — Slideshows
   ========================================= */

(function () {
  let activeTab = 'hero';

  const DEMO_HERO = [
    { id: 1, title: 'Ensemble pour la RDC', subtitle: 'Rejoignez le mouvement humanitaire', description: 'Image principale de la page d\'accueil.', image: '', cta_text: 'Faire un don', cta_url: '#donate', is_active: true, is_main: true, duration: 5500, order: 1 },
    { id: 2, title: 'L\'urgence n\'attend pas', subtitle: '27 millions de personnes en besoin', description: 'Slide sur la crise alimentaire.', image: '', cta_text: 'En savoir plus', cta_url: '#crisis', is_active: true, is_main: false, duration: 5500, order: 2 },
    { id: 3, title: 'Chaque don compte', subtitle: '100% de vos fonds va sur le terrain', description: 'Slide de confiance.', image: '', cta_text: 'Contribuer', cta_url: '#donate', is_active: true, is_main: false, duration: 5500, order: 3 },
    { id: 4, title: 'Témoignages du terrain', subtitle: 'Les voix de ceux qui survivent', description: 'Slide témoignage.', image: '', cta_text: 'Lire les récits', cta_url: '#stories', is_active: false, is_main: false, duration: 5500, order: 4 }
  ];

  const DEMO_STORIES = [
    { id: 101, title: 'Amélie, 12 ans, Kabila camp', subtitle: 'Une enfre qui rêve de redevenir médecin', description: 'Récit d\'Amélie, déplacée depuis 3 ans.', image: '', cta_text: 'Son histoire', cta_url: '#amelie', is_active: true, is_main: false, duration: 7000, order: 1 },
    { id: 102, title: 'Le village qui a retrouvé l\'eau', subtitle: '3 000 personnes bénéficiaires', description: 'Historique de la source rehabilitée.', image: '', cta_text: 'Découvrir', cta_url: '#village', is_active: true, is_main: false, duration: 7000, order: 2 },
    { id: 103, title: 'Les infirmières de Beni', subtitle: 'En première ligne de l\'urgence', description: 'Récit de nos équipes médicales.', image: '', cta_text: 'Voir la vidéo', cta_url: '#infirmieres', is_active: false, is_main: false, duration: 7000, order: 3 }
  ];

  let heroSlides = [...DEMO_HERO];
  let storySlides = [...DEMO_STORIES];
  let editingSlide = null;

  function getSlides() { return activeTab === 'hero' ? heroSlides : storySlides; }

  function render(container) {
    const slides = getSlides();

    container.innerHTML = `
      <div class="section-header">
        <h2>Diaporamas <span class="demo-badge">DEMO</span></h2>
        <button class="btn btn-primary" id="add-slide-btn">+ Nouveau slide</button>
      </div>
      <div class="tabs">
        <button class="tab ${activeTab === 'hero' ? 'active' : ''}" data-tab="hero">Hero Slides (${heroSlides.length})</button>
        <button class="tab ${activeTab === 'stories' ? 'active' : ''}" data-tab="stories">Field Stories (${storySlides.length})</button>
      </div>
      <div class="slide-list">
        ${slides.sort((a, b) => a.order - b.order).map(s => `
          <div class="slide-item" data-id="${s.id}">
            <span class="drag-handle">⠿</span>
            <span class="slide-order">${s.order}</span>
            <div class="slide-thumb">${s.image ? `<img src="${s.image}" alt="">` : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>'}</div>
            <div class="slide-info">
              <h4>${s.title}</h4>
              <p>${s.subtitle}</p>
            </div>
            ${App.statusBadge(s.is_active ? 'active' : 'inactive')}
            <div class="table-actions">
              <button class="btn btn-secondary btn-sm edit-slide" data-id="${s.id}">Modifier</button>
              <button class="btn btn-ghost btn-sm delete-slide" data-id="${s.id}">Supprimer</button>
            </div>
          </div>
        `).join('')}
        ${slides.length === 0 ? '<div class="empty-state"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg></div><p>Aucun slide</p></div>' : ''}
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { activeTab = t.dataset.tab; render(container); });
    });

    document.getElementById('add-slide-btn').addEventListener('click', () => {
      editingSlide = null;
      renderForm(container);
    });

    container.querySelectorAll('.edit-slide').forEach(btn => {
      btn.addEventListener('click', () => {
        const slides = getSlides();
        editingSlide = slides.find(s => s.id === parseInt(btn.dataset.id));
        renderForm(container);
      });
    });

    container.querySelectorAll('.delete-slide').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer ce slide ?', () => {
          if (activeTab === 'hero') heroSlides = heroSlides.filter(s => s.id !== parseInt(btn.dataset.id));
          else storySlides = storySlides.filter(s => s.id !== parseInt(btn.dataset.id));
          render(container);
        });
      });
    });
  }

  function renderForm(container) {
    const s = editingSlide || { title: '', subtitle: '', description: '', image: '', cta_text: '', cta_url: '', is_active: true, is_main: false, duration: 5500, order: getSlides().length + 1 };

    container.innerHTML = `
      <div class="section-header">
        <h2>${editingSlide ? 'Modifier' : 'Nouveau'} slide</h2>
        <button class="btn btn-secondary" id="back-to-slides">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Contenu du slide</div>
        <div class="form-group">
          <label>Titre</label>
          <input type="text" id="slide-title" value="${s.title}">
        </div>
        <div class="form-group">
          <label>Sous-titre</label>
          <input type="text" id="slide-subtitle" value="${s.subtitle}">
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="slide-desc" rows="3">${s.description}</textarea>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Média et actions</div>
        <div class="form-group">
          <label>Image (URL)</label>
          <input type="url" id="slide-image" value="${s.image}" placeholder="https://...">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Texte du bouton CTA</label>
            <input type="text" id="slide-cta-text" value="${s.cta_text}">
          </div>
          <div class="form-group">
            <label>URL du bouton CTA</label>
            <input type="text" id="slide-cta-url" value="${s.cta_url}">
          </div>
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
          <div class="form-group">
            <label>Durée (ms)</label>
            <input type="number" id="slide-duration" value="${s.duration}">
          </div>
          <div class="form-group">
            <label>Ordre d'affichage</label>
            <input type="number" id="slide-order" value="${s.order}">
          </div>
        </div>
      </div>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-slide-btn">${editingSlide ? 'Mettre à jour' : 'Créer le slide'}</button>
      </div>
    `;

    document.getElementById('back-to-slides').addEventListener('click', () => render(container));
    document.getElementById('save-slide-btn').addEventListener('click', () => {
      const data = {
        title: document.getElementById('slide-title').value,
        subtitle: document.getElementById('slide-subtitle').value,
        description: document.getElementById('slide-desc').value,
        image: document.getElementById('slide-image').value,
        cta_text: document.getElementById('slide-cta-text').value,
        cta_url: document.getElementById('slide-cta-url').value,
        is_active: document.getElementById('slide-active').checked,
        is_main: document.getElementById('slide-main').checked,
        duration: parseInt(document.getElementById('slide-duration').value),
        order: parseInt(document.getElementById('slide-order').value)
      };
      const slides = getSlides();
      if (editingSlide) {
        Object.assign(editingSlide, data);
      } else {
        data.id = Math.max(0, ...slides.map(s => s.id)) + 1;
        slides.push(data);
      }
      editingSlide = null;
      render(container);
    });
  }

  App.registerPage('slideshows', function (container) {
    activeTab = 'hero';
    editingSlide = null;
    render(container);
  });
})();
