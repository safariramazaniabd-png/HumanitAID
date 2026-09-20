/* =========================================
   HumanitAID Admin — Causes
   Branché sur l'API réelle (backend/routes/causes).
   ========================================= */

(function () {
  let causes = [];
  let editing = null;
  let loadError = null;

  async function load(container) {
    container.innerHTML = '<div class="section-header"><h2>Causes</h2></div><p class="text-muted">Chargement…</p>';
    const data = await App.api('/causes');
    if (!data || !data.causes) {
      loadError = true;
      causes = [];
    } else {
      loadError = false;
      causes = data.causes;
    }
    render(container);
  }

  function render(container) {
    if (loadError) {
      container.innerHTML = `
        <div class="section-header"><h2>Causes</h2></div>
        <p class="text-muted">Impossible de charger les causes depuis le serveur. Vérifiez la connexion à l'API.</p>
        <button class="btn btn-secondary" id="retry-causes">Réessayer</button>
      `;
      document.getElementById('retry-causes').addEventListener('click', () => load(container));
      return;
    }

    const sorted = [...causes].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    container.innerHTML = `
      <div class="section-header">
        <h2>Causes</h2>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Titre</th>
              <th>Objectif</th>
              <th>Collecté</th>
              <th>Progression</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map(c => {
              const goal = Number(c.goal) || 0;
              const collected = Number(c.collected) || 0;
              const pct = goal > 0 ? Math.round((collected / goal) * 100) : 0;
              const color = pct >= 75 ? 'green' : pct >= 40 ? 'gold' : 'red';
              return `
              <tr>
                <td>${c.display_order}</td>
                <td><strong>${c.title}</strong></td>
                <td>${c.goal ? App.formatMoney(goal) : ''}</td>
                <td>${c.collected ? App.formatMoney(collected) : ''}</td>
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
        editing = causes.find(c => c.id === btn.dataset.id);
        renderForm(container);
      });
    });
  }

  function renderForm(container) {
    const c = editing;
    const goal = Number(c.goal) || 0;
    const collected = Number(c.collected) || 0;
    const pct = goal > 0 ? Math.round((collected / goal) * 100) : 0;

    container.innerHTML = `
      <div class="section-header">
        <h2>Modifier : ${c.title}</h2>
        <button class="btn btn-secondary" id="back-causes">← Retour</button>
      </div>
      <div class="form-section">
        <div class="form-section-title">Détails de la cause</div>
        <div class="form-group"><label>Titre</label><input type="text" id="cause-title" value="${c.title}"></div>
        <div class="form-group"><label>Slug</label><input type="text" id="cause-slug" value="${c.slug}" disabled title="Le slug est fixe, il est utilisé par les liens existants."></div>
        <div class="form-group"><label>Description</label><textarea id="cause-desc" rows="4">${c.description || ''}</textarea></div>
        <div class="form-group"><label>Image (URL)</label><input type="url" id="cause-image" value="${c.image_url || ''}" placeholder="https://..."></div>
      </div>
      <div class="form-section">
        <div class="form-section-title">Finances</div>
        <div class="form-row">
          <div class="form-group"><label>Objectif ($)</label><input type="number" id="cause-goal" value="${goal}"></div>
          <div class="form-group"><label>Montant collecté ($)</label><input type="number" id="cause-collected" value="${collected}" title="À ajuster manuellement seulement si les dons réels ne sont pas encore tous enregistrés automatiquement."></div>
        </div>
        <div class="flex-center" style="margin-top:12px;">
          <span class="text-sm text-muted">Progression actuelle : ${pct}%</span>
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
              <option value="archived" ${c.status === 'archived' ? 'selected' : ''}>Archivé</option>
            </select>
          </div>
          <div class="form-group"><label>Ordre d'affichage</label><input type="number" id="cause-order" value="${c.display_order}"></div>
        </div>
      </div>
      <p class="text-sm text-muted" id="cause-save-error" hidden></p>
      <div class="btn-group" style="justify-content:flex-end;">
        <button class="btn btn-primary" id="save-cause-btn">Mettre à jour</button>
      </div>
    `;

    document.getElementById('back-causes').addEventListener('click', () => render(container));
    document.getElementById('save-cause-btn').addEventListener('click', async () => {
      const btn = document.getElementById('save-cause-btn');
      const errEl = document.getElementById('cause-save-error');
      btn.disabled = true;
      btn.textContent = 'Enregistrement…';

      const payload = {
        title: document.getElementById('cause-title').value,
        description: document.getElementById('cause-desc').value,
        image_url: document.getElementById('cause-image').value,
        goal: parseFloat(document.getElementById('cause-goal').value) || 0,
        collected: parseFloat(document.getElementById('cause-collected').value) || 0,
        status: document.getElementById('cause-status').value,
        display_order: parseInt(document.getElementById('cause-order').value, 10) || 0,
      };

      const res = await App.api(`/causes/${c.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      btn.disabled = false;
      btn.textContent = 'Mettre à jour';

      if (!res || res.error) {
        errEl.hidden = false;
        errEl.textContent = (res && res.error) || 'Erreur de connexion au serveur.';
        return;
      }

      editing = null;
      await load(container);
    });
  }

  App.registerPage('causes', function (container) { editing = null; load(container); });
})();