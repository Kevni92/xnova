import { RESOURCE_META, escapeHtml, formatNumber, formatPercent, navButton, resourceMarkup, signed } from './game-ui-format.js';

const NAV_ITEMS = Object.freeze([
  ['overview', 'Übersicht', '⌂'],
  ['resources', 'Rohstoffe', '◆'],
  ['buildings', 'Gebäude', '▦'],
  ['research', 'Forschung', '⌬'],
  ['shipyard', 'Werft', '△'],
  ['fleet', 'Flotte', '➤'],
  ['galaxy', 'Galaxie', '✦'],
]);

export function chromeMarkup(state, user, view) {
  const planet = state.activePlanet;
  const storageUsage = Math.max(
    planet.resources.metal / planet.storage.metal,
    planet.resources.crystal / planet.storage.crystal,
    planet.resources.deuterium / planet.storage.deuterium,
  );
  const storagePercent = Math.min(100, Math.round(storageUsage * 100));

  return `
    <header class="topbar">
      <div class="topbar__brand">
        <button class="icon-button topbar__menu-toggle" type="button" data-action="toggle-menu" data-testid="mobile-menu-toggle" aria-label="Hauptmenü öffnen">
          <span aria-hidden="true">☰</span><span class="sr-only">Hauptmenü öffnen</span>
        </button>
        <a class="brand-mark" href="#overview" data-view="overview" aria-label="XNOVA Übersicht">
          <span class="brand-mark__orb" aria-hidden="true"></span>
          <span><strong>XNOVA</strong><small>Command Interface</small></span>
        </a>
      </div>
      <div class="resource-strip" aria-label="Verfügbare Ressourcen">
        ${Object.entries(RESOURCE_META).map(([key, meta]) => resourceMarkup(key, meta, planet)).join('')}
        <div class="resource-item" data-testid="resource-energy">
          <span class="resource-item__icon resource-item__icon--energy">E</span>
          <span><small>Energie</small><strong>${signed(planet.energy.available)}</strong></span>
          <em class="resource-item__delta">${formatPercent(planet.energy.factor * 100)} Leistung</em>
        </div>
        <div class="resource-item resource-item--storage" title="Höchste Lagerauslastung">
          <span class="resource-item__icon" aria-hidden="true">▤</span>
          <span><small>Lager</small><strong>${storagePercent}%</strong></span>
          <span class="mini-meter" aria-hidden="true"><span style="width:${storagePercent}%"></span></span>
        </div>
      </div>
      <div class="topbar__actions">
        <button class="icon-button" type="button" data-action="logout" data-testid="logout-button" title="Ausloggen"><span aria-hidden="true">↪</span><span class="sr-only">Ausloggen</span></button>
        <details class="user-menu">
          <summary>
            <span class="avatar" aria-hidden="true">${escapeHtml(user.username.slice(0, 1).toUpperCase())}</span>
            <span class="user-menu__label"><strong>${escapeHtml(user.username)}</strong><small>Commander</small></span>
            <span aria-hidden="true">▾</span>
          </summary>
          <div class="user-menu__popover"><button type="button" data-action="logout">Ausloggen</button></div>
        </details>
      </div>
    </header>

    <aside class="sidebar" id="main-menu" aria-label="Hauptnavigation">
      <div class="planet-switcher">
        <div class="planet-visual planet-visual--small" aria-hidden="true"></div>
        <label>
          <span>Aktiver Planet</span>
          <select data-action="select-planet" aria-label="Aktiver Planet">
            ${state.planets.map((entry) => `<option value="${entry.coordinates}" ${entry.coordinates === planet.coordinates ? 'selected' : ''}>${escapeHtml(entry.name)} [${entry.coordinates}]</option>`).join('')}
          </select>
        </label>
      </div>
      <nav class="main-menu">${NAV_ITEMS.map(([key, label, icon]) => navButton(key, label, icon, view)).join('')}</nav>
      <div class="sidebar__footer">
        <div class="status-dot"><span></span> Lokaler Spielserver aktiv</div>
        <small>${escapeHtml(planet.name)} · ${planet.usedFields}/${planet.fields} Felder · ${formatNumber(planet.resources.metal)} Metall</small>
      </div>
    </aside>
    <button class="mobile-backdrop" type="button" data-action="toggle-menu" aria-label="Hauptmenü schließen"></button>
  `;
}
