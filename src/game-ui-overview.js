import { queueMarkup } from './game-ui-building-detail.js';
import { escapeHtml, formatNumber, formatPercent, signed } from './game-ui-format.js';

export function overviewMarkup(state, user) {
  const planet = state.activePlanet;
  return `
    <section class="page-heading"><div><p class="eyebrow">Kommandobrücke</p><h1 data-testid="greeting">Hallo ${escapeHtml(user.username)}, du bist eingeloggt.</h1><p>Verwalte dein Imperium auf ${escapeHtml(planet.name)}.</p></div><button class="button button--primary" data-view="buildings">Gebäude verwalten</button></section>
    <section class="stats-grid">
      ${statCard('Felder', `${planet.usedFields} / ${planet.fields}`, `${planet.fields - planet.projectedUsedFields} nach Warteschlange frei`)}
      ${statCard('Energie', signed(planet.energy.available), `${planet.energy.production} erzeugt · ${planet.energy.consumption} verbraucht`)}
      ${statCard('Produktion', `${formatNumber(planet.production.metal + planet.production.crystal + planet.production.deuterium)}/h`, 'Gesamte Rohstoffproduktion')}
      ${statCard('Bauaufträge', `${planet.buildQueue.length} / 5`, planet.buildQueue[0] ? `${planet.buildQueue[0].buildingName} aktiv` : 'Warteschlange frei')}
    </section>
    <section class="component-panel panel"><div class="panel-heading"><div><p class="eyebrow">Schnellzugriff</p><h2>Aktionen und Auswahl</h2></div><span class="section-note">Planetare Steuerung</span></div><div class="action-grid">${actionButton('buildings', 'Gebäude', 'Ausbau und Abriss', '▦')}${actionButton('resources', 'Ressourcen', 'Produktion und Lager', '◆')}${actionButton('research', 'Forschung', 'Technologien planen', '⌬')}${actionButton('galaxy', 'Galaxie', 'System erkunden', '◎')}</div></section>
    <section class="component-panel panel"><div class="panel-heading"><div><p class="eyebrow">Planet</p><h2>${escapeHtml(planet.name)} [${planet.coordinates}]</h2></div><span class="badge">${escapeHtml(planet.planetType)}</span></div><div class="economy-grid">${economyCard('Metall', planet.resources.metal, planet.production.metal, planet.storage.metal)}${economyCard('Kristall', planet.resources.crystal, planet.production.crystal, planet.storage.crystal)}${economyCard('Deuterium', planet.resources.deuterium, planet.production.deuterium, planet.storage.deuterium)}</div></section>
    ${queueMarkup(planet)}
  `;
}

export function resourcesMarkup(state) {
  const planet = state.activePlanet;
  return `
    <section class="page-heading"><div><p class="eyebrow">Wirtschaft</p><h1>Ressourcen</h1><p>Alle Bestände und Produktionswerte gehören zum ausgewählten Planeten.</p></div></section>
    <section class="resource-dashboard">${resourceDetailCard('Metall', 'M', planet.resources.metal, planet.production.metal, planet.storage.metal)}${resourceDetailCard('Kristall', 'K', planet.resources.crystal, planet.production.crystal, planet.storage.crystal)}${resourceDetailCard('Deuterium', 'D', planet.resources.deuterium, planet.production.deuterium, planet.storage.deuterium)}<article class="component-panel resource-detail"><span class="resource-detail__icon">E</span><div><small>Energieversorgung</small><strong>${signed(planet.energy.available)}</strong><p>${planet.energy.production} erzeugt · ${planet.energy.consumption} verbraucht · ${formatPercent(planet.energy.factor * 100)} Leistung</p></div></article></section>
    <section class="component-panel panel"><div class="panel-heading"><div><p class="eyebrow">Hinweis</p><h2>Produktionslogik</h2></div></div><p class="muted">Ressourcen werden zeitbasiert berechnet. Bei Energiemangel sinkt die Minenleistung proportional; volle Lager stoppen die Produktion des jeweiligen Rohstoffs.</p></section>
  `;
}

function actionButton(view, title, subtitle, icon) {
  return `<button class="action-card" data-view="${view}"><span>${icon}</span><strong>${title}</strong><small>${subtitle}</small></button>`;
}
function statCard(label, value, text) {
  return `<article class="stat-card component-panel"><small>${label}</small><strong>${value}</strong><span>${text}</span></article>`;
}
function economyCard(label, amount, rate, capacity) {
  const percent = Math.min(100, Math.round((amount / capacity) * 100));
  return `<article class="economy-card"><div><strong>${label}</strong><span>${formatNumber(amount)} / ${formatNumber(capacity)}</span></div><small>+${formatNumber(rate)}/h</small><span class="progress"><span style="width:${percent}%"></span></span></article>`;
}
function resourceDetailCard(label, icon, amount, rate, capacity) {
  return `<article class="component-panel resource-detail"><span class="resource-detail__icon">${icon}</span><div><small>${label}</small><strong>${formatNumber(amount)}</strong><p>+${formatNumber(rate)}/h · Lager ${formatNumber(capacity)}</p></div></article>`;
}
