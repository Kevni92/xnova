import { RESOURCE_META, escapeHtml, formatPercent, navButton, planetTone, resourceMarkup, signed } from './game-ui-format.js';

const NAV_ITEMS = Object.freeze([
  ['overview', 'Übersicht', '⌂'], ['resources', 'Ressourcen', '◆'], ['buildings', 'Gebäude', '▦'],
  ['research', 'Forschung', '⌬'], ['shipyard', 'Werft', '△'], ['fleet', 'Flotte', '➤'], ['galaxy', 'Galaxie', '◎'],
]);

export function chromeMarkup(state, user, view) {
  const planet = state.activePlanet;
  return `
    <header class="topbar"><a class="topbar__brand brand-mark" href="#overview" data-view="overview"><span class="brand-mark__orb"></span><span><strong>XNOVA</strong><small>Command Interface</small></span></a><div class="resource-strip" aria-label="Verfügbare Ressourcen">${Object.entries(RESOURCE_META).map(([key, meta]) => resourceMarkup(key, meta, planet)).join('')}<div class="resource-item" data-testid="resource-energy"><span class="resource-item__icon resource-item__icon--energy">E</span><span><small>Energie</small><strong>${signed(planet.energy.available)}</strong></span><em class="resource-item__delta">${formatPercent(planet.energy.factor * 100)} Leistung</em></div></div><div class="topbar__actions"><button class="icon-button mobile-menu-toggle" data-action="toggle-menu" data-testid="mobile-menu-toggle" aria-label="Menü öffnen">☰</button><span class="avatar">${escapeHtml(user.username.slice(0, 1).toUpperCase())}</span><span class="commander-name">${escapeHtml(user.username)}</span><button class="icon-button" data-action="logout" data-testid="logout-button" title="Ausloggen">↪</button></div></header>
    <aside class="sidebar"><label class="planet-switcher"><span>Aktiver Planet</span><select data-action="select-planet" aria-label="Aktiver Planet">${state.planets.map((entry) => `<option value="${entry.coordinates}" ${entry.coordinates === planet.coordinates ? 'selected' : ''}>${escapeHtml(entry.name)} [${entry.coordinates}]</option>`).join('')}</select></label><div class="planet-card"><div class="planet-orb planet-orb--${planetTone(planet.planetType)}" aria-hidden="true"></div><strong>${escapeHtml(planet.name)}</strong><small>${escapeHtml(planet.planetType)} · ${planet.usedFields}/${planet.fields} Felder</small></div><nav class="main-nav" aria-label="Spielbereiche">${NAV_ITEMS.map(([key, label, icon]) => navButton(key, label, icon, view)).join('')}</nav><div class="sidebar__status"><span></span> Lokaler Spielserver aktiv</div></aside>
  `;
}
