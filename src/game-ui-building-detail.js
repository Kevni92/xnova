import { costMarkup, escapeHtml, formatDuration } from './game-ui-format.js';

export function detailMarkup(detail, state) {
  const building = state.buildings.find((entry) => entry.key === detail.key);
  return `
    <button class="back-link" data-view="buildings">← Zur Gebäudeübersicht</button>
    <section class="detail-hero component-panel">
      <div class="building-visual building-visual--${detail.key}"><span>${detail.icon}</span><em>Stufe ${detail.currentLevel}</em></div>
      <div><p class="eyebrow">Gebäudedetails</p><h1>${escapeHtml(detail.name)}</h1><p>${escapeHtml(detail.description)}</p><div class="detail-actions"><button class="button button--primary" data-action="upgrade-building" data-building="${detail.key}" data-name="${escapeHtml(detail.name)}" ${building.canUpgrade ? '' : 'disabled'}>Stufe ${building.nextLevel} ausbauen</button><button class="button button--danger" data-action="demolish-building" data-building="${detail.key}" data-name="${escapeHtml(detail.name)}" ${building.canDemolish ? '' : 'disabled'}>Abreißen</button></div></div>
    </section>
    <section class="component-panel panel">
      <div class="panel-heading"><div><p class="eyebrow">Unbegrenzter Ausbau</p><h2>Aktuelle und nächste zehn Stufen</h2></div><span class="badge">Vorgemerkt: ${detail.projectedLevel}</span></div>
      <div class="table-wrap"><table class="level-table"><thead><tr><th>Stufe</th><th>Kosten</th><th>Bauzeit</th><th>Effekt</th><th>Status</th></tr></thead><tbody>
        ${detail.levels.map((row) => `<tr class="${row.current ? 'is-current' : ''}"><td>${row.level}</td><td>${row.level === 0 ? '–' : costMarkup(row.costs)}</td><td>${row.level === 0 ? '–' : formatDuration(row.durationSeconds)}</td><td>${escapeHtml(row.effect)}</td><td>${row.current ? '<span class="badge badge--success">Aktuell</span>' : row.queued ? '<span class="badge badge--warning">Eingeplant</span>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
    </section>
    ${queueMarkup(state.activePlanet)}
  `;
}

export function queueMarkup(planet) {
  const queue = planet.buildQueue.length === 0
    ? '<p class="empty-state">Keine Bauaufträge. Der nächste Ausbau kann sofort beginnen.</p>'
    : `<div class="queue-list">${planet.buildQueue.map((job) => `<article class="queue-item"><span class="queue-item__position">${job.position}</span><div><strong>${escapeHtml(job.buildingName)} · Stufe ${job.targetLevel}</strong><small>${job.action === 'demolish' ? 'Abriss' : 'Ausbau'} · ${job.active ? `Fertig in ${formatDuration(job.remainingSeconds)}` : 'Start nach vorherigem Auftrag'}</small></div><span class="queue-cost">${costMarkup(job.costs)}</span><button class="icon-button icon-button--danger" data-action="cancel-job" data-job="${job.id}" aria-label="Bauauftrag abbrechen">×</button></article>`).join('')}</div>`;
  return `<section class="component-panel panel queue-panel" data-testid="build-queue"><div class="panel-heading"><div><p class="eyebrow">Produktion</p><h2>Bauwarteschlange</h2></div><span class="badge">${planet.buildQueue.length} / 5</span></div>${queue}</section>`;
}
