/* =========================================
   HumanitAID Admin — Media Library
   ========================================= */

(function () {
  const DEMO_MEDIA = [
    { id: 1, filename: 'camp-deplacies-sud-kivu.jpg', type: 'image', size: '2.4 MB', date: '2026-09-01', alt: 'Camp de déplacés au Sud-Kivu', description: 'Vue aérienne du camp de déplacés de Bulengo', category: 'Terrain' },
    { id: 2, filename: 'eau-potable-source.jpg', type: 'image', size: '1.8 MB', date: '2026-08-28', alt: 'Source d\'eau potable rehabilitée', description: 'Source rehabilitée par HumanitAID', category: 'Projets' },
    { id: 3, filename: 'ecole-temporaire-goma.mp4', type: 'video', size: '45.2 MB', date: '2026-08-20', alt: 'École temporaire de Goma', description: 'Visite de l\'école temporaire installée au camp', category: 'Éducation' },
    { id: 4, filename: 'distribution-nourriture.jpg', type: 'image', size: '3.1 MB', date: '2026-08-15', alt: 'Distribution de nourriture', description: 'Distribution de rations alimentaires aux familles', category: 'Urgence' },
    { id: 5, filename: 'centre-sante-beni.jpg', type: 'image', size: '2.0 MB', date: '2026-08-10', alt: 'Centre de santé de Beni', description: 'Intérieur du centre de santé soutenu par HumanitAID', category: 'Santé' },
    { id: 6, filename: 'equipe-medicale.mp4', type: 'video', size: '67.8 MB', date: '2026-08-05', alt: 'Équipe médicale de terrain', description: 'L\'équipe médicale en intervention d\'urgence', category: 'Santé' },
    { id: 7, filename: 'enfants-ecole.jpg', type: 'image', size: '1.5 MB', date: '2026-07-28', alt: 'Enfants dans une classe', description: 'Enfants déplacés suivant les cours', category: 'Éducation' },
    { id: 8, filename: 'marche-goma.jpg', type: 'image', size: '2.7 MB', date: '2026-07-20', alt: 'Marché de Goma', description: 'Le marché central de Goma, principal point d\'approvisionnement', category: 'Terrain' }
  ];

  let media = [...DEMO_MEDIA];
  let typeFilter = 'all';

  function render(container) {
    const filtered = typeFilter === 'all' ? media : media.filter(m => m.type === typeFilter);
    const imgCount = media.filter(m => m.type === 'image').length;
    const vidCount = media.filter(m => m.type === 'video').length;

    container.innerHTML = `
      <div class="section-header">
        <h2>Médiathèque <span class="demo-badge">DEMO</span></h2>
        <div class="flex-center">
          <span class="text-muted text-sm">${media.length} fichiers (${imgCount} images, ${vidCount} vidéos)</span>
        </div>
      </div>

      <div class="upload-zone" id="upload-zone">
        <div class="upload-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/></svg></div>
        <div class="upload-text">Glissez vos fichiers ici ou cliquez pour sélectionner</div>
        <div class="upload-hint">Images (JPG, PNG, GIF) et vidéos (MP4) — Max 100 Mo</div>
      </div>

      <div class="tabs">
        <button class="tab ${typeFilter === 'all' ? 'active' : ''}" data-filter="all">Tous (${media.length})</button>
        <button class="tab ${typeFilter === 'image' ? 'active' : ''}" data-filter="image">Images (${imgCount})</button>
        <button class="tab ${typeFilter === 'video' ? 'active' : ''}" data-filter="video">Vidéos (${vidCount})</button>
      </div>

      <div class="media-grid">
        ${filtered.map(m => `
          <div class="media-item" data-id="${m.id}">
            <div class="media-thumb">
              ${m.type === 'video' ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="6" width="20" height="13" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>' : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>'}
            </div>
            <div class="media-info">
              <div class="filename">${m.filename}</div>
              <div class="meta">${m.type === 'image' ? 'Image' : 'Vidéo'} · ${m.size}</div>
              <div class="meta">${App.formatDate(m.date)}</div>
            </div>
          </div>
        `).join('')}
        ${filtered.length === 0 ? '<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 4h7l2 2h7v14H4z"/></svg></div><p>Aucun média trouvé</p></div>' : ''}
      </div>
    `;

    container.querySelectorAll('.tab').forEach(t => {
      t.addEventListener('click', () => { typeFilter = t.dataset.filter; render(container); });
    });

    container.querySelectorAll('.media-item').forEach(item => {
      item.addEventListener('click', () => {
        const m = media.find(x => x.id === parseInt(item.dataset.id));
        if (m) showDetail(m);
      });
    });

    const zone = document.getElementById('upload-zone');
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => { e.preventDefault(); zone.classList.remove('dragover'); });
    zone.addEventListener('click', () => {
      App.openModal('Upload de média', `
        <p class="text-muted" style="text-align:center;padding:20px;">La fonctionnalité d'upload est disponible avec le backend connecté.</p>
      `);
    });
  }

  function showDetail(m) {
    App.openModal('Détails du média', `
      <div style="text-align:center;margin-bottom:20px;">
        <div style="width:100%;height:200px;background:var(--bg);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;">
          ${m.type === 'video' ? '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="6" width="20" height="13" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none"/></svg>' : '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 15l-5-5-9 9"/></svg>'}
        </div>
      </div>
      <div class="form-group">
        <label>Nom du fichier</label>
        <input type="text" value="${m.filename}" readonly>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Type</label>
          <input type="text" value="${m.type === 'image' ? 'Image' : 'Vidéo'}" readonly>
        </div>
        <div class="form-group">
          <label>Taille</label>
          <input type="text" value="${m.size}" readonly>
        </div>
      </div>
      <div class="form-group">
        <label>Texte alternatif</label>
        <input type="text" value="${m.alt}">
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea rows="2">${m.description}</textarea>
      </div>
      <div class="form-group">
        <label>Catégorie</label>
        <input type="text" value="${m.category}">
      </div>
    `, `
      <button class="btn btn-secondary" onclick="App.closeModal()">Fermer</button>
      <button class="btn btn-danger" id="media-delete-btn">Supprimer</button>
    `);

    document.getElementById('media-delete-btn').addEventListener('click', () => {
      App.confirmModal('Supprimer', 'Supprimer ce fichier ?', () => {
        media = media.filter(x => x.id !== m.id);
        App.closeModal();
        render(document.getElementById('page-container'));
      });
    });
  }

  App.registerPage('media', render);
})();
