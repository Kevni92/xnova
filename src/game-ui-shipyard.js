import { costMarkup, escapeHtml, formatDuration, formatNumber } from './game-ui-format.js';

export function shipyardMarkup(shipyard) {
  if (!shipyard) return '<section class="component-section"><p>Werftdaten werden geladen …</p></section>';
  return `
    <div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Werft</span></div><p class="eyebrow">Orbitale Produktion</p><h1>Raumschiffwerft</h1><p class="lead">Schiffe werden planetenbezogen gebaut. Kosten werden beim Einreihen sofort abgezogen, fertige Einheiten stehen direkt für Flotten bereit.</p></div></div>
    <section class="research-summary" aria-label="Werftstatus">
      <article><small>Aktiver Planet</small><strong>${escapeHtml(shipyard.coordinates)}</strong></article>
      <article><small>Werftstufe</small><strong>Stufe ${shipyard.shipyardLevel}</strong></article>
      <article><small>Schiffe vor Ort</small><strong>${formatNumber(shipyard.totalShips)}</strong></article>
      <article><small>Warteschlange</small><strong>${shipyard.queueSlots.used} / ${shipyard.queueSlots.maximum}</strong></article>
    </section>
    ${shipyardQueueMarkup(shipyard.queue)}
    <section class="component-section"><div class="section-heading"><div><p class="eyebrow">Produktion</p><h2>Verfügbare Schiffstypen</h2></div><span class="section-note">Stapelproduktion bis 9.999 Einheiten</span></div><div class="shipyard-grid">${shipyard.ships.map(shipCardMarkup).join('')}</div></section>
  `;
}

function shipCardMarkup(ship) {
  return `
    <article class="game-card ship-card${ship.canBuild ? '' : ' is-locked'}" data-testid="ship-${ship.key}">
      <div class="game-card__visual ship-card__visual ship-card__visual--${ship.key}"><span aria-hidden="true">${escapeHtml(ship.icon)}</span><em class="level-badge">${formatNumber(ship.owned)} vorhanden</em></div>
      <div class="game-card__body ship-card__body">
        <div class="research-card__title"><h3>${escapeHtml(ship.name)}</h3><span>${escapeHtml(ship.role)}</span></div>
        <p>${escapeHtml(ship.description)}</p>
        <div class="ship-card__stats">
          <span><small>Laderaum</small>${formatNumber(ship.cargoCapacity)}</span>
          <span><small>Geschwindigkeit</small>${formatNumber(ship.speed)}</span>
          <span><small>Verbrauch</small>${formatNumber(ship.fuelConsumption)}</span>
          <span><small>Bauzeit</small>${formatDuration(ship.unitDurationSeconds)}</span>
        </div>
        <ul class="requirement-list">${ship.requirements.map(requirementMarkup).join('')}</ul>
        <div class="cost-row">${costMarkup(ship.costs)}<span class="cost cost--time">◷ ${formatDuration(ship.unitDurationSeconds)}</span></div>
        <form class="ship-build-form" data-action="build-ships" data-ship="${ship.key}" data-name="${escapeHtml(ship.name)}">
          <label class="field"><span>Stückzahl</span><input name="quantity" type="number" min="1" max="9999" step="1" value="1" required /></label>
          <button class="button button--primary" type="submit" ${ship.canBuild ? '' : 'disabled'}>Produzieren</button>
        </form>
      </div>
    </article>
  `;
}

function requirementMarkup(requirement) {
  return `<li class="${requirement.complete ? 'is-complete' : 'is-missing'}"><span aria-hidden="true">${requirement.complete ? '✓' : '×'}</span><div><strong>${escapeHtml(requirement.name)}</strong><small>Benötigt ${requirement.requiredLevel} · Vorhanden ${requirement.currentLevel}</small></div></li>`;
}

function shipyardQueueMarkup(queue) {
  if (!queue.length) {
    return '<section class="component-panel research-queue research-queue--empty"><div><p class="eyebrow">Werftwarteschlange</p><h2>Keine Produktion aktiv</h2><p>Bis zu fünf Schiffsstapel können eingeplant werden.</p></div></section>';
  }
  return `
    <section class="component-section"><div class="section-heading"><div><p class="eyebrow">Werftwarteschlange</p><h2>Laufende Produktion</h2></div><span class="section-note">Fertige Einheiten werden fortlaufend gutgeschrieben</span></div>
      <div class="shipyard-queue">${queue.map((job) => `
        <article class="component-panel shipyard-job${job.active ? ' is-active' : ''}" data-testid="shipyard-job-${job.id}">
          <div class="shipyard-job__icon" aria-hidden="true">${escapeHtml(job.shipName.slice(0, 2).toUpperCase())}</div>
          <div><p class="eyebrow">${job.active ? 'In Produktion' : 'Eingeplant'}</p><h3>${escapeHtml(job.shipName)} · ${job.produced}/${job.quantity}</h3><div class="progress"><span style="width:${job.progress}%"></span></div><small>${formatDuration(job.remainingSeconds)} verbleibend · ${job.remaining} Einheiten offen</small></div>
          <button class="button button--danger" type="button" data-action="cancel-shipyard-job" data-job="${job.id}">Abbrechen</button>
        </article>`).join('')}</div>
    </section>
  `;
}
