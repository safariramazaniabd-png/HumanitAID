/* =========================================
   HumanitAID Admin — Dashboard
   ========================================= */

App.registerPage('dashboard', function (container) {
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon red">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div class="stat-label">Total des dons <span class="demo-badge">DEMO</span></div>
        <div class="stat-value">$1 036 000</div>
        <div class="stat-meta">+12% ce mois</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon gold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
        </div>
        <div class="stat-label">Dons aujourd'hui <span class="demo-badge">DEMO</span></div>
        <div class="stat-value">$4 200</div>
        <div class="stat-meta">+8% vs hier</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="stat-label">Total donateurs <span class="demo-badge">DEMO</span></div>
        <div class="stat-value">1 247</div>
        <div class="stat-meta">+23 cette semaine</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <div class="stat-label">Campagnes actives <span class="demo-badge">DEMO</span></div>
        <div class="stat-value">5</div>
        <div class="stat-meta">Sur 7 total</div>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Dons récents</div>
            <div class="card-subtitle">5 dernières transactions <span class="demo-badge">DEMO</span></div>
          </div>
          <a href="#/donations" class="btn btn-secondary btn-sm">Voir tout</a>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Donateur</th>
                <th>Montant</th>
                <th>Cause</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#DON-2847</td>
                <td>Amira K.</td>
                <td>$150</td>
                <td>Eau potable</td>
                <td>03 sept. 2026</td>
              </tr>
              <tr>
                <td>#DON-2846</td>
                <td>Jean-Pierre M.</td>
                <td>$75</td>
                <td>Santé</td>
                <td>03 sept. 2026</td>
              </tr>
              <tr>
                <td>#DON-2845</td>
                <td>Fatima D.</td>
                <td>$200</td>
                <td>Éducation</td>
                <td>02 sept. 2026</td>
              </tr>
              <tr>
                <td>#DON-2844</td>
                <td>Anonyme</td>
                <td>$50</td>
                <td>Alimentation</td>
                <td>02 sept. 2026</td>
              </tr>
              <tr>
                <td>#DON-2843</td>
                <td>Moussa T.</td>
                <td>$500</td>
                <td>Shelter</td>
                <td>01 sept. 2026</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Impact humanitaire</div>
            <div class="card-subtitle">Chiffres cumulés <span class="demo-badge">DEMO</span></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="stat-card">
            <div class="stat-label">Personnes aidées</div>
            <div class="stat-value" style="font-size:22px;">247 800</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Familles</div>
            <div class="stat-value" style="font-size:22px;">18 420</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Interventions</div>
            <div class="stat-value" style="font-size:22px;">156</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Zones couvertes</div>
            <div class="stat-value" style="font-size:22px;">23</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2 mb-24">
      <div class="card">
        <div class="card-header">
          <div class="card-title">Vue du contenu <span class="demo-badge">DEMO</span></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="flex-center" style="justify-content:space-between;">
            <span class="text-muted">Articles publiés</span>
            <strong>12</strong>
          </div>
          <div class="flex-center" style="justify-content:space-between;">
            <span class="text-muted">Photos</span>
            <strong>48</strong>
          </div>
          <div class="flex-center" style="justify-content:space-between;">
            <span class="text-muted">Vidéos</span>
            <strong>8</strong>
          </div>
          <div class="flex-center" style="justify-content:space-between;">
            <span class="text-muted">Témoignages</span>
            <strong>6</strong>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Actions rapides</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <a href="#/publications" class="btn btn-primary" style="justify-content:center;">Nouvel article</a>
          <a href="#/media" class="btn btn-secondary" style="justify-content:center;">Uploader du média</a>
          <a href="#/donations" class="btn btn-secondary" style="justify-content:center;">Voir les dons</a>
        </div>
      </div>
    </div>
  `;
});
