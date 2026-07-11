import { escapeHtml } from './game-ui-format.js';

export function galaxyMarkup(system, message) {
  if (!system) return '<section class="component-panel panel">Systemdaten werden geladen …</section>';
  const positions = system.positions.map((entry) => {
    const colony = entry.colony;
    const text = entry.occupied
      ? `${escapeHtml(colony?.ownerName ?? 'Besetzt')} · ${colony?.fields ?? '?'} Felder`
      : 'Eigenschaften werden erst bei Kolonisierung enthüllt';
    const action = entry.occupied
      ? `<span class="badge${colony?.ownedByViewer ? ' badge--success' : ''}">${colony?.ownedByViewer ? 'Eigener Planet' : 'Besetzt'}</span>`
      : `<button class="button button--secondary" data-action="colonize" data-position="${entry.position}" data-testid="colonize-${entry.position}">Kolonisieren</button>`;
    return `<article class="galaxy-row" data-testid="galaxy-position-${entry.position}"><span class="galaxy-row__position">${entry.position}</span><div><strong>${escapeHtml(colony?.name ?? 'Unkartografierter Planet')}</strong><small>${text}</small></div>${action}</article>`;
  }).join('');
  return `<section class="page-heading"><div><p class="eyebrow">Sternenkartografie</p><h1>Galaxie ${system.galaxy}:${system.system}</h1><p>Freie Positionen können kolonisiert werden.</p></div></section>${message ? `<div class="alert alert--${message.tone}" data-testid="colony-notice">${escapeHtml(message.text)}</div>` : ''}<section class="component-panel panel galaxy-panel"><div class="galaxy-list">${positions}</div></section>`;
}

export function placeholderMarkup(title, description, icon) {
  return `<section class="page-heading"><div><p class="eyebrow">Systemmodul</p><h1>${title}</h1><p>${description}</p></div></section><section class="component-panel placeholder-panel"><span>${icon}</span><h2>${title} wird vorbereitet</h2><p>${description}</p></section>`;
}
