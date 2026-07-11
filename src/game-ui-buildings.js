import { queueMarkup } from './game-ui-building-detail.js';
import { costMarkup, escapeHtml, formatDuration } from './game-ui-format.js';

export function buildingsMarkup(state) {
  return `
    <section class="page-heading"><div><p class="eyebrow">Planetarer Ausbau</p><h1>Gebäude</h1><p>Kosten werden beim Einreihen sofort abgezogen. Bis zu fünf Aufträge können geplant werden.</p></div></section>
    <section class="building-grid" data-testid="building-list">${state.buildings.map(buildingCard).join('')}</section>
    ${queueMarkup(state.activePlanet)}
  `;
}

function buildingCard(building) {
  const queuedLevel = building.projectedLevel !== building.currentLevel ? ` → ${building.projectedLevel}` : '';
  const demolition = building.projectedLevel > 0
    ? `<div class="demolition-info"><span>Abrisskosten</span>${costMarkup(building.demolitionCosts)}<span class="cost cost--time">◷ ${formatDuration(building.demolitionDurationSeconds)}</span></div>`
    : '';
  return `
    <article class="building-card component-panel" data-testid="building-${building.key}">
      <button class="building-visual building-visual--${building.key}" data-action="open-building" data-building="${building.key}" aria-label="Details zu ${escapeHtml(building.name)}"><span>${building.icon}</span><em>Stufe ${building.currentLevel}</em></button>
      <div class="building-card__body">
        <div class="building-title"><button data-action="open-building" data-building="${building.key}" aria-label="${escapeHtml(building.name)}">${escapeHtml(building.name)}</button><span class="badge">Stufe ${building.currentLevel}${queuedLevel}</span></div>
        <p>${escapeHtml(building.description)}</p>
        <dl class="building-facts"><div><dt>Aktuell</dt><dd>${escapeHtml(building.currentEffect)}</dd></div><div><dt>Nächste Stufe</dt><dd>${escapeHtml(building.nextEffect)}</dd></div></dl>
        <div class="cost-row">${costMarkup(building.upgradeCosts)}<span class="cost cost--time">◷ ${formatDuration(building.upgradeDurationSeconds)}</span></div>
        ${demolition}
        <div class="building-actions"><button class="button button--primary" data-action="upgrade-building" data-building="${building.key}" data-name="${escapeHtml(building.name)}" ${building.canUpgrade ? '' : 'disabled'}>Stufe ${building.nextLevel} ausbauen</button><button class="button button--danger" data-action="demolish-building" data-building="${building.key}" data-name="${escapeHtml(building.name)}" ${building.canDemolish ? '' : 'disabled'}>Abreißen</button></div>
      </div>
    </article>
  `;
}
