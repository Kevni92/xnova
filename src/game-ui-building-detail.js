import { costMarkup, escapeHtml, formatDuration, resourceTextMarkup } from './game-ui-format.js';

export function detailMarkup(detail, state) {
  const building = state.buildings.find((entry) => entry.key === detail.key);
  return `
    <div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><button class="table-sort" data-view="buildings">Gebäude</button><span>/</span><span>${escapeHtml(detail.name)}</span></div><p class="eyebrow">Gebäudedetails</p><h1>${escapeHtml(detail.name)}</h1><p class="lead">${resourceTextMarkup(detail.description)}</p></div><div class="content-heading__actions"><button class="button button--primary" data-action="upgrade-building" data-building="${detail.key}" data-name="${escapeHtml(detail.name)}" ${building.canUpgrade ? '' : 'disabled'}>Stufe ${building.nextLevel} ausbauen</button><button class="button button--danger" data-action="demolish-building" data-building="${detail.key}" data-name="${escapeHtml(detail.name)}" ${building.canDemolish ? '' : 'disabled'}>Abreißen</button></div></div>
    <section class="component-section"><div class="section-heading"><div><p class="eyebrow">Unbegrenzter Ausbau</p><h2>Aktuelle und nächste zehn Stufen</h2></div><span class="badge badge--info">Vorgemerkt: ${detail.projectedLevel}</span></div><article class="component-panel component-panel--table"><div class="table-wrap"><table><thead><tr><th>Stufe</th><th>Kosten</th><th>Bauzeit</th><th>Effekt</th><th>Status</th></tr></thead><tbody>${detail.levels.map((row) => `<tr class="${row.current ? 'is-current' : ''}"><td>${row.level}</td><td>${row.level === 0 ? '–' : costMarkup(row.costs)}</td><td>${row.level === 0 ? '–' : formatDuration(row.durationSeconds)}</td><td>${resourceTextMarkup(row.effect)}</td><td>${row.current ? '<span class="badge badge--success">Aktuell</span>' : row.queued ? '<span class="badge badge--warning">Eingeplant</span>' : ''}</td></tr>`).join('')}</tbody></table></div></article></section>
    ${queueMarkup(state.activePlanet)}
  `;
}

export function queueMarkup(planet) {
  const queue = planet.buildQueue.length === 0
    ? '<div class="empty-state"><span class="empty-state__icon">✓</span><strong>Keine Bauaufträge</strong><p>Der nächste Ausbau kann sofort beginnen.</p></div>'
    : `<div class="queue-list">${planet.buildQueue.map((job) => `<article class="queue-item"><span class="queue-item__position">${job.position}</span><span class="queue-item__art">${job.action === 'demolish' ? '↓' : 'ₑ'}</span><div class="queue-item__content"><strong>${escapeHtml(job.buildingName)} · Stufe ${job.targetLevel}</strong><span>${job.action === 'demolish' ? 'Abriss' : 'Ausbau'} · ${job.active ? `Fertig in ${formatDuration(job.remainingSeconds)}` : 'Start nach vorherigem Auftrag'}</span><div class="cost-row">${costMarkup(job.costs)}</div></div><button class="icon-button icon-button--danger" data-action="cancel-job" data-job="${job.id}" aria-label="Bauauftrag abbrechen">×</button></article>`).join('')}</div>`;
  return `<section class="component-section" data-testid="build-queue"><div class="section-heading"><div><p class="eyebrow">Produktion</p><h2>Bauwarteschlange</h2></div><span class="badge badge--neutral">${planet.buildQueue.length} / 5</span></div><article class="component-panel">${queue}</article></section>`;
}
