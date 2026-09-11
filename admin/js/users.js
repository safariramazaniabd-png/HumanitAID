/* =========================================
   HumanitAID Admin — Users
   ========================================= */

(function () {
  let users = [
    { id: 1, name: 'Super Admin', email: 'admin@humanit-aid.org', role: 'Super Admin', status: 'active', last_login: '2026-09-03T14:30:00' },
    { id: 2, name: 'Marie Kasongo', email: 'marie@humanit-aid.org', role: 'Admin', status: 'active', last_login: '2026-09-03T10:15:00' },
    { id: 3, name: 'Jean-Pierre Mutombo', email: 'jp@humanit-aid.org', role: 'Editor', status: 'active', last_login: '2026-09-02T16:45:00' },
    { id: 4, name: 'Nadia Lukusa', email: 'nadia@humanit-aid.org', role: 'Editor', status: 'active', last_login: '2026-09-01T09:00:00' },
    { id: 5, name: 'Samuel Kabongo', email: 'samuel@humanit-aid.org', role: 'Finance', status: 'active', last_login: '2026-08-30T11:20:00' },
    { id: 6, name: 'Viewer Demo', email: 'viewer@humanit-aid.org', role: 'Viewer', status: 'inactive', last_login: '2026-08-15T08:00:00' }
  ];

  let editing = null;

  function render(container) {
    container.innerHTML = `
      <div class="section-header">
        <h2>Utilisateurs <span class="demo-badge">DEMO</span></h2>
        <button class="btn btn-primary" id="new-user-btn">+ Nouvel utilisateur</button>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td class="text-muted">${u.email}</td>
                <td>${App.roleBadge(u.role)}</td>
                <td>${App.statusBadge(u.status)}</td>
                <td class="text-muted">${App.formatDate(u.last_login)}</td>
                <td class="table-actions">
                  <button class="btn btn-secondary btn-sm edit-user" data-id="${u.id}">Modifier</button>
                  ${u.role !== 'Super Admin' ? `<button class="btn btn-ghost btn-sm delete-user" data-id="${u.id}">Supprimer</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('new-user-btn').addEventListener('click', () => { editing = null; renderForm(container); });
    container.querySelectorAll('.edit-user').forEach(btn => {
      btn.addEventListener('click', () => { editing = users.find(u => u.id === parseInt(btn.dataset.id)); renderForm(container); });
    });
    container.querySelectorAll('.delete-user').forEach(btn => {
      btn.addEventListener('click', () => {
        App.confirmModal('Supprimer', 'Supprimer cet utilisateur ?', () => {
          users = users.filter(u => u.id !== parseInt(btn.dataset.id));
          render(container);
        });
      });
    });
  }

  function renderForm(container) {
    const u = editing || { name: '', email: '', role: 'Viewer', status: 'active' };

    container.innerHTML = `
      <div class="section-header">
        <h2>${editing ? 'Modifier' : 'Nouvel'} utilisateur</h2>
        <button class="btn btn-secondary" id="back-users">← Retour</button>
      </div>
      <div class="form-section" style="max-width:600px;">
        <div class="form-group"><label>Nom complet</label><input type="text" id="user-name" value="${u.name}"></div>
        <div class="form-group"><label>Email</label><input type="email" id="user-email" value="${u.email}"></div>
        <div class="form-group">
          <label>Rôle</label>
          <select id="user-role">
            <option value="Super Admin" ${u.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>
            <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
            <option value="Editor" ${u.role === 'Editor' ? 'selected' : ''}>Éditeur</option>
            <option value="Finance" ${u.role === 'Finance' ? 'selected' : ''}>Finance</option>
            <option value="Viewer" ${u.role === 'Viewer' ? 'selected' : ''}>Observateur</option>
          </select>
        </div>
        <div class="form-check">
          <input type="checkbox" id="user-active" ${u.status === 'active' ? 'checked' : ''}>
          <label for="user-active">Compte actif</label>
        </div>
        <div class="btn-group" style="justify-content:flex-end;">
          <button class="btn btn-primary" id="save-user-btn">${editing ? 'Mettre à jour' : 'Créer'}</button>
        </div>
      </div>
    `;

    document.getElementById('back-users').addEventListener('click', () => render(container));
    document.getElementById('save-user-btn').addEventListener('click', () => {
      const data = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        role: document.getElementById('user-role').value,
        status: document.getElementById('user-active').checked ? 'active' : 'inactive'
      };
      if (editing) Object.assign(editing, data);
      else { data.id = Math.max(0, ...users.map(u => u.id)) + 1; data.last_login = new Date().toISOString(); users.push(data); }
      editing = null;
      render(container);
    });
  }

  App.registerPage('users', function (container) { editing = null; render(container); });
})();
