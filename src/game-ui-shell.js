import { detailMarkup } from './game-ui-building-detail.js';
import { buildingsMarkup } from './game-ui-buildings.js';
import { chromeMarkup } from './game-ui-chrome.js';
import { escapeHtml } from './game-ui-format.js';
import { galaxyMarkup, placeholderMarkup } from './game-ui-galaxy.js';
import { overviewMarkup, resourcesMarkup } from './game-ui-overview.js';

export function renderGameShell(model, user) {
  const { state, detail, galaxy, view, notice, galaxyNotice, menuOpen } = model;
  if (!state) return '<section class="loading-card">Spielstand wird geladen …</section>';
  return `
    <div class="game-shell ${menuOpen ? 'is-menu-open' : ''}" data-testid="ui-showcase">
      ${chromeMarkup(state, user, view)}
      <main class="content">
        ${notice ? `<div class="alert alert--${notice.tone}" data-testid="game-notice">${escapeHtml(notice.text)}</div>` : ''}
        ${view === 'overview' ? overviewMarkup(state, user) : ''}
        ${view === 'resources' ? resourcesMarkup(state) : ''}
        ${view === 'buildings' ? buildingsMarkup(state) : ''}
        ${view === 'detail' && detail ? detailMarkup(detail, state) : ''}
        ${view === 'research' ? placeholderMarkup('Forschung', 'Technologien und Voraussetzungen werden als nächstes Feature umgesetzt.', '⌬') : ''}
        ${view === 'shipyard' ? placeholderMarkup('Werft', 'Schiffe und Verteidigungsanlagen folgen nach Forschung.', '△') : ''}
        ${view === 'fleet' ? placeholderMarkup('Flotte', 'Flottenauftàge sind noch nicht freigeschaltet.', '➤') : ''}
        ${view === 'galaxy' ? galaxyMarkup(galaxy, galaxyNotice) : ''}
      </main>
    </div>
  `;
}
