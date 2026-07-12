import { queueMarkup } from './game-ui-building-detail.js';
import { costMarkup, escapeHtml, formatDuration } from './game-ui-format.js';

export function buildingsMarkup(state) {
  return `
    <div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Gebäude</span></div><p class="eyebrow">Planetarer Ausbau</p><h1>Gebäude</h1><p class="lead">Kosten werden beim Einreihen sofort abgezogen. Bis zu fünf Auftàge können geplant werden.</p></div></div>
    <section class="component-section"><div class="section-heading"><div><p class="eyebrow">Ausbau</p><h2>Planetare Anlagen</h2></div><span class="section-note">${state.activePlanet.usedFields}/${state.activePlanet.fields} Felder belegt</span></div><div class="game-card-grid" data-testid="building-list">${state.buildings.map(buildingCard).join('')}</div></section>
    ${queueMarkup(state.activePlanet)}
  `;
}

function buildingCard(building) {
  const queuedLevel = building.projectedLevel !== building.currentLevel ? ` → ${building.projectedLevel}` : '';
  const demolition = building.projectedLevel > 0
    ? `<div class="alert alert--warning"><span aria-hidden="true">↔</span><span>Abriss: ${costMarkup(building.demolitionCosts)} · ${formatDuration(building.demolitionDurationSeconds)}</span></div>`
    : '';
  return `
    <article class="game-card" data-testid="building-${building.key}">
      <button class="game-card__visual game-card__visual--${building.key}" data-action="open-building" data-building="${building.key}" aria-label="Details zu ${escapeHtml(building.name)}"><span>${building.icon}</span><em class="level-badge">Stufe ${building.currentLevel}${queuedLevel}</em></button>
      <div class="game-card__body">
        <div class="panel-heading"><h3><button class="table-sort" data-action="open-building" data-building="${building.key}" aria-label="${escapeHtml(building.name)}">${escapeHtml(building.name)}</button></h3><span class="badge badge--neutral">Stufe ${building.currentLevel}</span></div>
        <p>${escapeHtml(building.description)}</p>
        <div class="meter-list"><div class="meter-item"><div><strong>Aktuell</strong><span>${escapeHtml(building.currentEffect)}</span></div></div><div class="meter-item"><div><strong>Nächste Stufe</strong><span>${escapeHtml(building.nextEffect)}</span></div></div></div>
        <div class="cost-row">${costMarkup(building.upgradeCosts)}<span class="cost cost--time">◷ ${formatDuration(building.upgradeDurationSeconds)}</span></div>
        ${demolition}
        <div class="button-row"><button class="button button--primary" data-action="upgrade-building" data-building="${building.key}" data-name="${escapeHtml(building.name)}" ${building.canUpgrade ? '' : 'disabled'}>Stufe ${building.nextLevel} ausbauen</button><button class="button button--danger" data-action="demolish-building" data-building="${building.key}" data-name="${escapeHtml(building.name)}" ${building.canDemolish ? '' : 'disabled'}>Abreißen</button></div>
      </div>
    </article>
  `;
}
