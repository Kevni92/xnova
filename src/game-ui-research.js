import { costMarkup, escapeHtml, formatDuration, formatNumber, resourceIconMarkup } from './game-ui-format.js';

export function researchMarkup(research) {
  if (!research) return '<section class="component-section"><p>Forschungsdaten werden geladen …</p></section>';
  return `
    <div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Forschung</span></div><p class="eyebrow">Technologieentwicklung</p><h1>Forschung</h1><p class="lead">Forschungen gelten accountweit. Voraussetzungen und Forschungszeit entsprechen dem klassischen OGame-System.</p></div></div>
    <section class="research-summary" aria-label="Forschungsstatus">
      <article><small>Aktiver Planet</small><strong>${escapeHtml(research.coordinates)}</strong></article>
      <article><small>Forschungslabor</small><strong>Stufe ${research.selectedLabLevel}</strong></article>
      <article><small>Verfügbare Energie</small><strong>${formatNumber(research.availableEnergy)}</strong></article>
      <article><small>Forschungsauftrag</small><strong>${research.queue ? 'Aktiv' : 'Frei'}</strong></article>
    </section>
    ${researchQueueMarkup(research.queue)}
    ${research.categories.map(categoryMarkup).join('')}
  `;
}

function categoryMarkup(category) {
  return `
    <section class="component-section research-category" data-testid="research-category-${category.key}">
      <div class="section-heading"><div><p class="eyebrow">Forschungsbaum</p><h2>${escapeHtml(category.name)}</h2><p>${escapeHtml(category.description)}</p></div><span class="section-note">${category.researches.length} Technologien</span></div>
      <div class="research-tree">${category.researches.map(researchCard).join('')}</div>
    </section>
  `;
}

function researchCard(research) {
  const stateClass = research.maxed ? ' is-complete' : research.active ? ' is-active' : research.canResearch ? '' : ' is-locked';
  const buttonText = research.maxed ? 'Abgeschlossen' : research.active ? 'Wird erforscht' : `Stufe ${research.nextLevel} erforschen`;
  const energyCost = research.costs.energy > 0
    ? `<span class="cost cost--energy">${resourceIconMarkup('energy')}<span>${formatNumber(research.costs.energy)}</span></span>`
    : '';
  return `
    <article class="game-card research-card${stateClass}" data-testid="research-${research.key}">
      <div class="game-card__visual research-card__visual research-card__visual--${research.category}"><span aria-hidden="true">${escapeHtml(research.icon)}</span><em class="level-badge">Stufe ${research.currentLevel}</em></div>
      <div class="game-card__body research-card__body">
        <div class="research-card__title"><h3>${escapeHtml(research.name)}</h3><span>${research.maxed ? 'MAX' : `→ ${research.nextLevel}`}</span></div>
        <p>${escapeHtml(research.description)}</p>
        <div class="research-card__effects"><span><small>Aktuell</small>${escapeHtml(research.currentEffect)}</span><span><small>Nächste Stufe</small>${escapeHtml(research.nextEffect)}</span></div>
        <ul class="requirement-list">${research.requirements.map(requirementMarkup).join('')}</ul>
        <div class="cost-row research-card__costs">${costMarkup(research.costs)}${energyCost}<span class="cost cost--time">◷ ${formatDuration(research.durationSeconds)}</span></div>
        <div class="research-card__network">Effektive Laborstufe: <strong>${research.effectiveLabLevel}</strong></div>
        <button class="button button--primary" type="button" data-action="start-research" data-research="${research.key}" data-name="${escapeHtml(research.name)}" ${research.canResearch ? '' : 'disabled'}>${buttonText}</button>
      </div>
    </article>
  `;
}

function requirementMarkup(requirement) {
  return `<li class="${requirement.complete ? 'is-complete' : 'is-missing'}"><span aria-hidden="true">${requirement.complete ? '✓' : '×'}</span><div><strong>${escapeHtml(requirement.name)}</strong><small>Benötigt ${requirement.requiredLevel} · Vorhanden ${requirement.currentLevel}</small></div></li>`;
}

function researchQueueMarkup(queue) {
  if (!queue) {
    return '<section class="component-panel research-queue research-queue--empty"><div><p class="eyebrow">Forschungsauftrag</p><h2>Kein Auftrag aktiv</h2><p>Es kann genau eine Forschung gleichzeitig laufen.</p></div></section>';
  }
  return `
    <section class="component-panel research-queue" data-testid="research-queue">
      <div class="research-queue__icon" aria-hidden="true">⌬</div>
      <div class="research-queue__body"><p class="eyebrow">Aktive Forschung</p><h2>${escapeHtml(queue.researchName)} · Stufe ${queue.targetLevel}</h2><p>Gestartet auf ${escapeHtml(queue.originCoordinates)} · effektive Laborstufe ${queue.effectiveLabLevel}</p><div class="progress"><span style="width:${queue.progress}%"></span></div><small>${formatDuration(queue.remainingSeconds)} verbleibend · ${queue.progress}%</small></div>
      <button class="button button--danger" type="button" data-action="cancel-research">Abbrechen</button>
    </section>
  `;
}
