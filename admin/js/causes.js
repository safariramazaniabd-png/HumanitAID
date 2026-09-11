/* =========================================
   HumanitAID Admin — Causes
   ========================================= */

(function () {
  let causes = [
    { id: 1, title: 'Eau potable pour tous', slug: 'eau-potable', description: 'Construire des points d\'eau et des systemes de filtration dans les communautés rurales du Sud-Kivu.', image: '', goal: 200000, collected: 142500, status: 'active', order: 1 },
    { id: 2, title: 'Santé d\'urgence', slug: 'sante-urgence', description: 'Financer des centres de santé mobiles et des équipes médicales d\'urgence dans les zones de conflit.', image: '', goal: 350000, collected: 198000, status: 'active', order: 2 },
    { id: 3, title: 'Éducation des enfants', slug: 'education-enfants', description: 'Créer des écoles temporaires et fournir du matériel scolaire aux enfants déplacés.', image: '', goal: 150000, collected: 87600, status: 'active', order: 3 },
    { id: 4, title: 'Sécurité alimentaire', slug: 'securite-alimentaire', description: 'Distribuer des rations alimentaires et soutenir l\'agriculture locale pour lutter contre la famine.', image: '', goal: 500000, collected: 325000, status: 'active', order: 4 },
    { id: 5, title: 'Abri et shelter', slug: 'abri-shelter', description: 'Construire des abris temporaires pour les familles déplacées par les conflits armés.', image: '', goal: 280000, collected: 165400, status: 'active', order: 5 }
  ];

  let editing = null;

  function render(container) {
    container.innerHTML = `
      <div class="section-header">
        <h2>Causes <span class="demo-badge">DEMO</span></h2>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Titre</th>
              <th>Objectif</th>
              <th>Collecté (DEMO)</th>
              <th>Progression</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${causes.sort((a, b) => a.order - b.order).map(c => {
              const pct = Math.round((c.collected / c.goal) * 100);
              const color = pct >= 75 ? 'green' : pct >= 40 ? 'gold' : 'red';
              return `
              <tr>
                <td>${c.order}</td>
                <td><strong>${c.title}</strong></td>
                <td>${App.formatMoney(c.goal)}</td>
                <td>${App.formatMoney(c.collected)} <span class="demo-badge">DEMO</span></td>
                <td style="min-width:150px;">
                  <div class="flex-center" style="margin-bottom:4px;">
                    <span class="text-sm text-muted">${pct}%</span>
                  </div>
                  <div class="progress-bar"><div class="progress-bar-fill ${color}" style="width:${pct}%"></div></div>
                </td>
                <td>${App.statusBadge(c.status)}</td>
                <td>
                  <button class="btn btn-secondary btn-sm edit-cause" data-id="${c.id}">Modifier</button>
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.querySelectorAll('.edit-cause').forEach(btn => {
      btn.addEventListener('click', () => {
        editing = causes.find(c => c.id === parseInt(btn.dataset.id));
        renderForm(container);
      });
    });
  }

  function renderForm(container) {
    const c = editing;
    const pct = Math.round((c.collected / c.goal) * 100);

    container.innerHTML = `
      <div class="section-header">
        <h2>Modifier : ${c.title}</h2>
        <button class="btn btn-secondary" id="back-causes">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Détails de la cause</div>
        <div class="form-group"><label>Titre</label><input type="text" id="cause-title" value="${c.title}"></div>
        <div class="form-group"><label>Slug</label><input type="text" id="cause-slug" value="${c.slug}"></div>
        <div class="form-group"><label>Description</label><textarea id="cause-desc" rows="4">${c.description}</textarea></div>
        <div class="form-group"><label>Image (URL)</label><input type="url" id="cause-image" value="${c.image}" placeholder="https://..."></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Finances <span class="demo-badge">DEMO</span></div>
        <div class="form-row">
          <div class="form-group"><label>Objectif ($)</label><input type="number" id="cause-goal" value="${c.goal}"></div>
          <div class="form-group"><label>Montant collecté ($) — DEMO</label><input type="number" id="cause-collected" value="${c.collected}"></div>
        </div>
        <div class="flex-center" style="margin-top:12px;">
          <span class="text-sm text-muted">Progression actuelle : ${pct}%</span>
          <div class="progress-bar" style="flex:1;"><div class="progress-bar-fill gold" style="width:${pct}%"></div></div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Paramètres</div>
        <div class="form-row">
          <div class="form-group">
            <label>Statut</label>
            <select id="cause-status">
              <option value="active" ${c.status === 'active' ? 'selected' : ''}>Actif</option>
              <option value="paused" ${c.status === 'paused' ? 'selected' : ''}>En pause</option>
              <option value="completed" ${c.status === 'completed' ? 'selected' : ''}>Terminé</option>
            </select>
          </div>
          <div class="form-group"><label>Ordre d'affichage</label><input type="number" id="cause-order" value="${c.order}"></div>
        </div>
      </div>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-cause-btn">Mettre à jour</button>
      </div>
    `;

    document.getElementById('back-causes').addEventListener('click', () => render(container));
    document.getElementById('save-cause-btn').addEventListener('click', () => {
      c.title = document.getElementById('cause-title').value;
      c.slug = document.getElementById('cause-slug').value;
      c.description = document.getElementById('cause-desc').value;
      c.image = document.getElementById('cause-image').value;
      c.goal = parseInt(document.getElementById('cause-goal').value);
      c.collected = parseInt(document.getElementById('cause-collected').value);
      c.status = document.getElementById('cause-status').value;
      c.order = parseInt(document.getElementById('cause-order').value);
      editing = null;
      render(container);
    });
  }

  App.registerPage('causes', function (container) { editing = null; render(container); });
})();
