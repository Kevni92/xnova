import { escapeHtml } from './game-ui-format.js';

export function galaxyMarkup(system, message) {
  if (!system) return '<article class="component-panel">Systemdaten werden geladen …</article>';
  const positions = system.positions.map((entry) => {
    const colony = entry.colony;
    const text = entry.occupied
      ? `${escapeHtml(colony?.ownerName ?? 'Besetzt')} · ${colony?.fields ?? '?'} Felder`
      : 'Eigenschaften werden erst bei Kolonisierung enthüllt';
    const action = entry.occupied
      ? `<span class="badge ${colony?.ownedByViewer ? 'badge--success' : 'badge--neutral'}">${colony?.ownedByViewer ? 'Eigener Planet' : 'Besetzt'}</span>`
      : `<button class="button button--secondary button--small" data-action="colonize" data-position="${entry.position}" data-testid="colonize-${entry.position}">Kolonisieren</button>`;
    return `<article class="galaxy-row${colony?.ownedByViewer ? ' galaxy-row--own' : ''}" data-testid="galaxy-position-${entry.position}"><span class="galaxy-row__position">${entry.position}</span><span class="planet-dot planet-dot--large" aria-hidden="true"></span><div><strong>${escapeHtml(colony?.name ?? 'Unkartografierter Planet')}</strong><small>${text}</small></div>${action}</article>`;
  }).join('');
  return `<div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Galaxie</span></div><p class="eyebrow">Sternenkartografie</p><h1>Galaxie ${system.galaxy}:${system.system}</h1><p class="lead">Freie Positionen können kolonisiert werden.</p></div></div>${message ? `<div class="alert alert--${message.tone}" data-testid="colony-notice"><span aria-hidden="true">✓</span><strong>${escapeHtml(message.text)}</strong></div>` : ''}<section class="component-section"><article class="component-panel"><div class="galaxy-list">${positions}</div></article></section>`;
}

export function placeholderMarkup(title, description, icon) {
  return `<div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>${title}</span></div><p class="eyebrow">Systemmodul</p><h1>${title}</h1><p class="lead">${description}</p></div></div><section class="component-section"><div class="empty-state"><span class="empty-state__icon">${icon}</span><strong>${title} wird vorbereitet</strong><p>${description}</p></div></section>`;
}
