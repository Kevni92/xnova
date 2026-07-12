import { detailMarkup } from './game-ui-building-detail.js';
import { buildingsMarkup } from './game-ui-buildings.js';
import { chromeMarkup } from './game-ui-chrome.js';
import { escapeHtml } from './game-ui-format.js';
import { galaxyMarkup, placeholderMarkup } from './game-ui-galaxy.js';
import { overviewMarkup, resourcesMarkup } from './game-ui-overview.js';
import { researchMarkup } from './game-ui-research.js';

export function renderGameShell(model, user) {
  const { state, detail, galaxy, research, view, notice, galaxyNotice, menuOpen } = model;
  if (!state) return '<section class="card compact centered"><p>Spielstand wird geladen …</p></section>';
  return `
    <div class="game-shell ${menuOpen ? 'is-menu-open' : ''}" data-testid="ui-showcase">
      ${chromeMarkup(state, user, view)}
      <main class="game-content" id="${view}">
        ${notice ? `<div class="alert alert--${notice.tone}" data-testid="game-notice"><span aria-hidden="true">${notice.tone === 'success' ? '✓' : '!'}</span><strong>${escapeHtml(notice.text)}</strong></div>` : ''}
        ${view === 'overview' ? overviewMarkup(state, user) : ''}
        ${view === 'resources' ? resourcesMarkup(state) : ''}
        ${view === 'buildings' ? buildingsMarkup(state) : ''}
        ${view === 'detail' && detail ? detailMarkup(detail, state) : ''}
        ${view === 'research' ? researchMarkup(research) : ''}
        ${view === 'shipyard' ? placeholderMarkup('Werft', 'Schiffe und Verteidigungsanlagen folgen nach Forschung.', '△') : ''}
        ${view === 'fleet' ? placeholderMarkup('Flotte', 'Flottenaufträge sind noch nicht freigeschaltet.', '➤') : ''}
        ${view === 'galaxy' ? galaxyMarkup(galaxy, galaxyNotice) : ''}
      </main>
    </div>
  `;
}
