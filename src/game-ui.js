const RESOURCE_META = Object.freeze({
  metal: { label: 'Metall', icon: 'M' },
  crystal: { label: 'Kristall', icon: 'K' },
  deuterium: { label: 'Deuterium', icon: 'D' },
});

export async function mountGameFeature({ root, server, user, onLogout }) {
  let state = null;
  let detail = null;
  let view = 'overview';
  let notice = null;
  let loading = false;

  async function refresh({ quiet = false } = {}) {
    if (loading) return;
    loading = true;
    try {
      state = await server.call('getGameState');
      if (detail) {
        detail = await server.call('getBuildingDetails', {
          coordinates: state.activePlanet.coordinates,
          buildingKey: detail.key,
        });
      }
      if (!quiet) notice = null;
      render();
    } catch (error) {
      notice = { tone: 'danger', text: error.message };
      render();
    } finally {
      loading = false;
    }
  }

  function render() {
    if (!state) {
      root.innerHTML = '<section class="loading-card">Spielstand wird geladen …</section>';
      return;
    }

    const planet = state.activePlanet;
    root.innerHTML = `
      <div class="game-shell" data-testid="game-shell">
        <header class="topbar">
          <a class="brand" href="#overview" data-view="overview"><span class="brand__orb"></span><span><strong>XNOVA</strong><small>Planetary Command</small></span></a>
          <div class="resource-strip" aria-label="Verfügbare Ressourcen">
            ${Object.entries(RESOURCE_META).map(([key, meta]) => resourceMarkup(key, meta, planet)).join('')}
            <div class="resource-item resource-item--energy" data-testid="resource-energy">
              <span class="resource-icon">E</span>
              <span><small>Energie</small><strong>${signed(planet.energy.available)}</strong></span>
              <em>${formatPercent(planet.energy.factor * 100)} Leistung</em>
            </div>
          </div>
          <div class="topbar__user"><span class="avatar">${escapeHtml(user.username.slice(0, 1).toUpperCase())}</span><strong>${escapeHtml(user.username)}</strong><button class="icon-button" data-action="logout" data-testid="logout-button" title="Ausloggen">↪</button></div>
        </header>

        <aside class="sidebar">
          <label class="planet-select">
            <span>Aktiver Planet</span>
            <select data-action="select-planet" aria-label="Aktiver Planet">
              ${state.planets.map((entry) => `<option value="${entry.coordinates}" ${entry.coordinates === planet.coordinates ? 'selected' : ''}>${escapeHtml(entry.name)} [${entry.coordinates}]</option>`).join('')}
            </select>
          </label>
          <div class="planet-orb planet-orb--${planetTone(planet.planetType)}" aria-hidden="true"></div>
          <strong class="planet-name">${escapeHtml(planet.name)}</strong>
          <small>${escapeHtml(planet.planetType)} · ${planet.usedFields}/${planet.fields} Felder</small>
          <nav class="main-nav" aria-label="Spielbereiche">
            ${navButton('overview', 'Übersicht', '⌂', view)}
            ${navButton('buildings', 'Gebäude', '▦', view)}
          </nav>
          <div class="sidebar__status"><span></span> Lokaler Spielserver aktiv</div>
        </aside>

        <main class="content">
          ${notice ? `<div class="alert alert--${notice.tone}" data-testid="game-notice">${escapeHtml(notice.text)}</div>` : ''}
          ${view === 'overview' ? overviewMarkup(state, user) : ''}
          ${view === 'buildings' ? buildingsMarkup(state) : ''}
          ${view === 'detail' && detail ? detailMarkup(detail, state) : ''}
        </main>
      </div>
    `;
    bindEvents();
  }

  function bindEvents() {
    root.querySelectorAll('[data-view]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        view = button.dataset.view;
        detail = null;
        render();
      });
    });

    root.querySelector('[data-action="logout"]')?.addEventListener('click', onLogout);
    root.querySelector('[data-action="select-planet"]')?.addEventListener('change', async (event) => {
      await perform(() => server.call('selectPlanet', { coordinates: event.target.value }), 'Planet gewechselt.');
    });

    root.querySelectorAll('[data-action="open-building"]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          detail = await server.call('getBuildingDetails', {
            coordinates: state.activePlanet.coordinates,
            buildingKey: button.dataset.building,
          });
          view = 'detail';
          render();
        } catch (error) {
          notice = { tone: 'danger', text: error.message };
          render();
        }
      });
    });

    root.querySelectorAll('[data-action="upgrade-building"]').forEach((button) => {
      button.addEventListener('click', () => perform(
        () => server.call('upgradeBuilding', {
          coordinates: state.activePlanet.coordinates,
          buildingKey: button.dataset.building,
        }),
        `${button.dataset.name} wurde in die Bauwarteschlange aufgenommen.`,
      ));
    });

    root.querySelectorAll('[data-action="demolish-building"]').forEach((button) => {
      button.addEventListener('click', () => perform(
        () => server.call('demolishBuilding', {
          coordinates: state.activePlanet.coordinates,
          buildingKey: button.dataset.building,
        }),
        `Abriss von ${button.dataset.name} wurde eingeplant.`,
      ));
    });

    root.querySelectorAll('[data-action="cancel-job"]').forEach((button) => {
      button.addEventListener('click', () => perform(
        () => server.call('cancelBuildJob', {
          coordinates: state.activePlanet.coordinates,
          jobId: button.dataset.job,
        }),
        'Bauauftrag abgebrochen. 75 % der Kosten wurden erstattet.',
      ));
    });
  }

  async function perform(operation, successText) {
    if (loading) return;
    loading = true;
    root.querySelectorAll('button, select').forEach((element) => { element.disabled = true; });
    try {
      await operation();
      notice = { tone: 'success', text: successText };
      state = await server.call('getGameState');
      if (detail) {
        detail = await server.call('getBuildingDetails', {
          coordinates: state.activePlanet.coordinates,
          buildingKey: detail.key,
        });
      }
    } catch (error) {
      notice = { tone: 'danger', text: error.message };
    } finally {
      loading = false;
      render();
    }
  }

  await refresh();
  const interval = window.setInterval(() => refresh({ quiet: true }), 3000);
  return () => window.clearInterval(interval);
}

function overviewMarkup(state, user) {
  const planet = state.activePlanet;
  return `
    <section class="page-heading">
      <div><p class="eyebrow">Kommandobrücke</p><h1 data-testid="greeting">Hallo ${escapeHtml(user.username)}, du bist eingeloggt.</h1><p>Verwalte Produktion, Energie und Baufortschritt auf ${escapeHtml(planet.name)}.</p></div>
      <button class="button button--primary" data-view="buildings">Gebäude verwalten</button>
    </section>
    <section class="stats-grid">
      ${statCard('Felder', `${planet.usedFields} / ${planet.fields}`, `${planet.fields - planet.projectedUsedFields} nach Warteschlange frei`)}
      ${statCard('Energie', signed(planet.energy.available), `${planet.energy.production} erzeugt · ${planet.energy.consumption} verbraucht`)}
      ${statCard('Produktion', `${formatNumber(planet.production.metal + planet.production.crystal + planet.production.deuterium)}/h`, 'Gesamte Rohstoffproduktion')}
      ${statCard('Bauaufträge', `${planet.buildQueue.length} / 5`, planet.buildQueue[0] ? `${planet.buildQueue[0].buildingName} aktiv` : 'Warteschlange frei')}
    </section>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Planet</p><h2>${escapeHtml(planet.name)} [${planet.coordinates}]</h2></div><span class="badge">${escapeHtml(planet.planetType)}</span></div>
      <div class="economy-grid">
        ${economyCard('Metall', planet.resources.metal, planet.production.metal, planet.storage.metal)}
        ${economyCard('Kristall', planet.resources.crystal, planet.production.crystal, planet.storage.crystal)}
        ${economyCard('Deuterium', planet.resources.deuterium, planet.production.deuterium, planet.storage.deuterium)}
      </div>
    </section>
    ${queueMarkup(planet)}
  `;
}

function buildingsMarkup(state) {
  return `
    <section class="page-heading"><div><p class="eyebrow">Planetarer Ausbau</p><h1>Gebäude</h1><p>Kosten werden beim Einreihen sofort abgezogen. Bis zu fünf Aufträge können geplant werden.</p></div></section>
    <section class="building-grid" data-testid="building-list">
      ${state.buildings.map((building) => buildingCard(building)).join('')}
    </section>
    ${queueMarkup(state.activePlanet)}
  `;
}

function buildingCard(building) {
  return `
    <article class="building-card" data-testid="building-${building.key}">
      <button class="building-visual building-visual--${building.key}" data-action="open-building" data-building="${building.key}" aria-label="Details zu ${escapeHtml(building.name)}"><span>${building.icon}</span><em>Stufe ${building.currentLevel}</em></button>
      <div class="building-card__body">
        <div class="building-title"><button data-action="open-building" data-building="${building.key}">${escapeHtml(building.name)}</button><span class="badge">Stufe ${building.currentLevel}${building.projectedLevel !== building.currentLevel ? ` → ${building.projectedLevel}` : ''}</span></div>
        <p>${escapeHtml(building.description)}</p>
        <dl class="building-facts"><div><dt>Aktuell</dt><dd>${escapeHtml(building.currentEffect)}</dd></div><div><dt>Nächste Stufe</dt><dd>${escapeHtml(building.nextEffect)}</dd></div></dl>
        <div class="cost-row">${costMarkup(building.upgradeCosts)}<span class="cost cost--time">◷ ${formatDuration(building.upgradeDurationSeconds)}</span></div>
        ${building.projectedLevel > 0 ? `<div class="demolition-info"><span>Abrisskosten</span>${costMarkup(building.demolitionCosts)}<span class="cost cost--time">◷ ${formatDuration(building.demolitionDurationSeconds)}</span></div>` : ''}
        <div class="building-actions">
          <button class="button button--primary" data-action="upgrade-building" data-building="${building.key}" data-name="${escapeHtml(building.name)}" ${building.canUpgrade ? '' : 'disabled'}>Stufe ${building.nextLevel} ausbauen</button>
          <button class="button button--danger" data-action="demolish-building" data-building="${building.key}" data-name="${escapeHtml(building.name)}" ${building.canDemolish ? '' : 'disabled'}>Abreißen</button>
        </div>
      </div>
    </article>
  `;
}

function detailMarkup(detail, state) {
  const building = state.buildings.find((entry) => entry.key === detail.key);
  return `
    <button class="back-link" data-view="buildings">← Zur Gebäudeübersicht</button>
    <section class="detail-hero">
      <div class="building-visual building-visual--${detail.key}"><span>${detail.icon}</span><em>Stufe ${detail.currentLevel}</em></div>
      <div><p class="eyebrow">Gebäudedetails</p><h1>${escapeHtml(detail.name)}</h1><p>${escapeHtml(detail.description)}</p><div class="detail-actions"><button class="button button--primary" data-action="upgrade-building" data-building="${detail.key}" data-name="${escapeHtml(detail.name)}" ${building.canUpgrade ? '' : 'disabled'}>Stufe ${building.nextLevel} ausbauen</button><button class="button button--danger" data-action="demolish-building" data-building="${detail.key}" data-name="${escapeHtml(detail.name)}" ${building.canDemolish ? '' : 'disabled'}>Abreißen</button></div></div>
    </section>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Unbegrenzter Ausbau</p><h2>Aktuelle und nächste zehn Stufen</h2></div><span class="badge">Vorgemerkt: ${detail.projectedLevel}</span></div>
      <div class="table-wrap"><table class="level-table"><thead><tr><th>Stufe</th><th>Kosten</th><th>Bauzeit</th><th>Effekt</th><th>Status</th></tr></thead><tbody>
        ${detail.levels.map((row) => `<tr class="${row.current ? 'is-current' : ''}"><td>${row.level}</td><td>${row.level === 0 ? '–' : costMarkup(row.costs)}</td><td>${row.level === 0 ? '–' : formatDuration(row.durationSeconds)}</td><td>${escapeHtml(row.effect)}</td><td>${row.current ? '<span class="badge badge--success">Aktuell</span>' : row.queued ? '<span class="badge badge--warning">Eingeplant</span>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
    ${queueMarkup(state.activePlanet)}
  `;
}

function queueMarkup(planet) {
  return `
    <section class="panel queue-panel" data-testid="build-queue">
      <div class="panel-heading"><div><p class="eyebrow">Produktion</p><h2>Bauwarteschlange</h2></div><span class="badge">${planet.buildQueue.length} / 5</span></div>
      ${planet.buildQueue.length === 0 ? '<p class="empty-state">Keine Bauaufträge. Der nächste Ausbau kann sofort beginnen.</p>' : `<div class="queue-list">${planet.buildQueue.map((job) => `<article class="queue-item"><span class="queue-position">${job.position}</span><div><strong>${escapeHtml(job.buildingName)} · Stufe ${job.targetLevel}</strong><small>${job.action === 'demolish' ? 'Abriss' : 'Ausbau'} · ${job.active ? `Fertig in ${formatDuration(job.remainingSeconds)}` : `Start nach vorherigem Auftrag`}</small></div><span class="queue-cost">${costMarkup(job.costs)}</span><button class="icon-button icon-button--danger" data-action="cancel-job" data-job="${job.id}" aria-label="Bauauftrag abbrechen">×</button></article>`).join('')}</div>`}
    </section>
  `;
}

function resourceMarkup(key, meta, planet) {
  return `<div class="resource-item" data-testid="resource-${key}"><span class="resource-icon">${meta.icon}</span><span><small>${meta.label}</small><strong>${formatNumber(planet.resources[key])}</strong></span><em>+${formatNumber(planet.production[key])}/h</em></div>`;
}

function navButton(key, label, icon, active) {
  return `<button class="nav-item ${active === key ? 'is-active' : ''}" data-view="${key}"><span>${icon}</span>${label}</button>`;
}

function statCard(label, value, text) {
  return `<article class="stat-card"><small>${label}</small><strong>${value}</strong><span>${text}</span></article>`;
}

function economyCard(label, amount, rate, capacity) {
  const percent = Math.min(100, Math.round((amount / capacity) * 100));
  return `<article class="economy-card"><div><strong>${label}</strong><span>${formatNumber(amount)} / ${formatNumber(capacity)}</span></div><small>+${formatNumber(rate)}/h</small><span class="progress"><span style="width:${percent}%"></span></span></article>`;
}

function costMarkup(costs) {
  return Object.entries(RESOURCE_META)
    .filter(([key]) => Number(costs[key]) > 0)
    .map(([key, meta]) => `<span class="cost cost--${key}">${meta.icon} ${formatNumber(costs[key])}</span>`)
    .join('') || '<span class="cost">Kostenlos</span>';
}

function formatNumber(value) { return new Intl.NumberFormat('de-DE').format(Math.floor(Number(value) || 0)); }
function formatPercent(value) { return `${Math.round(value)} %`; }
function signed(value) { const number = Math.floor(Number(value) || 0); return `${number >= 0 ? '+' : ''}${formatNumber(number)}`; }
function formatDuration(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}` : `${minutes}:${String(rest).padStart(2, '0')}`;
}
function planetTone(type) {
  if (type === 'Eiswelt') return 'ice';
  if (type === 'Vulkanwelt') return 'volcanic';
  if (type === 'Wüstenwelt') return 'desert';
  if (type === 'Ozeanwelt') return 'ocean';
  return 'terran';
}
function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
