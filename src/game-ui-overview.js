import { queueMarkup } from './game-ui-building-detail.js';
import {
  escapeHtml,
  formatNumber,
  formatPercent,
  resourceIconMarkup,
  resourceValueMarkup,
  signed,
} from './game-ui-format.js';

export function overviewMarkup(state, user) {
  const planet = state.activePlanet;
  return `
    <div class="content-heading">
      <div>
        <div class="breadcrumbs" aria-label="Brotkrumen-Navigation"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Übersicht</span></div>
        <p class="eyebrow">Kommandobrücke</p>
        <h1 data-testid="greeting">Hallo ${escapeHtml(user.username)}, du bist eingeloggt.</h1>
        <p class="lead">Verwalte dein Imperium auf ${escapeHtml(planet.name)} und behalte Ressourcen, Energie und Bauaufträge im Blick.</p>
      </div>
      <div class="content-heading__actions"><button class="button button--primary" data-view="buildings">Gebäude verwalten</button></div>
    </div>

    <section class="dashboard-grid" aria-label="Imperiumsstatus">
      ${statCard('◉', 'Felder', `${planet.usedFields} / ${planet.fields}`, `${planet.fields - planet.projectedUsedFields} nach Warteschlange frei`)}
      ${statCard(resourceIconMarkup('energy', { className: 'resource-icon--plain', decorative: true }), 'Energie', resourceValueMarkup('energy', signed(planet.energy.available)), energySummary(planet.energy))}
      ${statCard(resourceClusterMarkup(), 'Produktion', `${formatNumber(planet.production.metal + planet.production.crystal + planet.production.deuterium)}/h`, 'Gesamte Rohstoffproduktion')}
      ${statCard('!', 'Bauaufträge', `${planet.buildQueue.length} / 5`, planet.buildQueue[0] ? `${planet.buildQueue[0].buildingName} aktiv` : 'Warteschlange frei', planet.buildQueue.length ? ' stat-card--warning' : '')}
    </section>

    <section class="component-section">
      <div class="section-heading"><div><p class="eyebrow">01 · Steuerung</p><h2>Aktionen und Auswahl</h2></div><span class="section-note">Planetare Schnellzugriffe</span></div>
      <div class="component-grid component-grid--two">
        ${actionPanel('buildings', 'Gebäude', 'Ausbau, Abriss und Bauwarteschlange', '▦')}
        ${actionPanel('resources', 'Ressourcen', 'Produktion, Energie und Lager', '◆')}
        ${actionPanel('research', 'Forschung', 'Technologien und Voraussetzungen', '⌬')}
        ${actionPanel('galaxy', 'Galaxie', 'Sternsystem erkunden und kolonisieren', '✦')}
      </div>
    </section>

    <section class="component-section">
      <div class="section-heading"><div><p class="eyebrow">02 · Wirtschaft</p><h2>${escapeHtml(planet.name)} [${planet.coordinates}]</h2></div><span class="badge badge--info">${escapeHtml(planet.planetType)}</span></div>
      <div class="component-grid component-grid--two">
        ${economyCard('metal', 'Metall', planet.resources.metal, planet.production.metal, planet.storage.metal)}
        ${economyCard('crystal', 'Kristall', planet.resources.crystal, planet.production.crystal, planet.storage.crystal)}
        ${economyCard('deuterium', 'Deuterium', planet.resources.deuterium, planet.production.deuterium, planet.storage.deuterium)}
        ${energyCard(planet.energy)}
      </div>
    </section>
    ${queueMarkup(planet)}
  `;
}

export function resourcesMarkup(state) {
  const planet = state.activePlanet;
  return `
    <div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Rohstoffe</span></div><p class="eyebrow">Wirtschaft</p><h1>Ressourcen</h1><p class="lead">Alle Bestände und Produktionswerte gehören zum ausgewählten Planeten.</p></div></div>
    <section class="component-section">
      <div class="section-heading"><div><p class="eyebrow">Bestände</p><h2>Produktion und Lager</h2></div></div>
      <div class="component-grid component-grid--two">
        ${resourceDetailCard('metal', 'Metall', planet.resources.metal, planet.production.metal, planet.storage.metal)}
        ${resourceDetailCard('crystal', 'Kristall', planet.resources.crystal, planet.production.crystal, planet.storage.crystal)}
        ${resourceDetailCard('deuterium', 'Deuterium', planet.resources.deuterium, planet.production.deuterium, planet.storage.deuterium)}
        ${energyCard(planet.energy)}
      </div>
    </section>
    <section class="component-section"><article class="component-panel"><div class="panel-heading"><h3>Produktionslogik</h3><span class="badge badge--info">Zeitbasiert</span></div><p class="muted">Bei Energiemangel sinkt die Minenleistung proportional. Volle Lager stoppen die Produktion des jeweiligen Rohstoffs.</p></article></section>
  `;
}

function actionPanel(view, title, subtitle, icon) {
  return `<article class="component-panel"><div class="panel-heading"><h3>${title}</h3><span class="badge badge--neutral">${icon}</span></div><p class="muted">${subtitle}</p><button class="button button--secondary button--block" data-view="${view}">${title} öffnen</button></article>`;
}

function statCard(icon, label, value, text, modifier = '') {
  return `<article class="stat-card${modifier}"><span class="stat-card__icon">${icon}</span><div><small>${label}</small><strong>${value}</strong><span>${text}</span></div></article>`;
}

function resourceClusterMarkup() {
  return `<span class="resource-icon-cluster" aria-label="Metall, Kristall und Deuterium">${['metal', 'crystal', 'deuterium'].map((key) => resourceIconMarkup(key, { className: 'resource-icon--plain', decorative: true })).join('')}</span>`;
}

function resourceHeading(key, label) {
  return `<span class="resource-heading">${resourceIconMarkup(key, { className: 'resource-icon--plain', decorative: true })}<span>${label}</span></span>`;
}

function economyCard(key, label, amount, rate, capacity) {
  const percent = Math.min(100, Math.round((amount / capacity) * 100));
  return `<article class="component-panel"><div class="panel-heading"><h3>${resourceHeading(key, label)}</h3><span class="badge badge--neutral">${resourceValueMarkup(key, `+${formatNumber(rate)}/h`)}</span></div><div class="meter-item"><div><strong>${resourceValueMarkup(key, formatNumber(amount))}</strong><span>Lager ${resourceValueMarkup(key, formatNumber(capacity))}</span></div><span class="progress"><span style="width:${percent}%"></span></span></div></article>`;
}

function resourceDetailCard(key, label, amount, rate, capacity) {
  const percent = Math.min(100, Math.round((amount / capacity) * 100));
  return `<article class="component-panel"><div class="panel-heading"><h3>${resourceHeading(key, label)}</h3><span class="badge badge--info">${resourceIconMarkup(key, { className: 'resource-icon--plain', decorative: true })}</span></div><div class="meter-item"><div><strong>${resourceValueMarkup(key, formatNumber(amount))}</strong><span>Lager ${resourceValueMarkup(key, formatNumber(capacity))}</span></div><span class="progress"><span style="width:${percent}%"></span></span></div><p class="muted">Produktion: ${resourceValueMarkup(key, `+${formatNumber(rate)}/h`)}</p></article>`;
}

function energyCard(energy) {
  return `<article class="component-panel"><div class="panel-heading"><h3>${resourceHeading('energy', 'Energieversorgung')}</h3><span class="badge ${energy.available >= 0 ? 'badge--success' : 'badge--danger'}">${resourceValueMarkup('energy', signed(energy.available))}</span></div><p class="muted">${energySummary(energy)} · ${formatPercent(energy.factor * 100)} Leistung</p></article>`;
}

function energySummary(energy) {
  return `${resourceValueMarkup('energy', `${formatNumber(energy.production)} erzeugt`)} · ${resourceValueMarkup('energy', `${formatNumber(energy.consumption)} verbraucht`)}`;
}
