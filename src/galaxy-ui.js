import { resourceValueMarkup } from './game-ui-format.js';

const DEFAULT_SYSTEM = Object.freeze({ galaxy: 1, system: 24 });

export async function mountGalaxyFeature({ server }) {
  const list = document.querySelector('.galaxy-list');
  if (!list) return;

  const panel = list.closest('.component-panel');
  const heading = panel.querySelector('.panel-heading h3');
  const badge = panel.querySelector('.panel-heading .badge');

  list.innerHTML = '<div class="skeleton-list" aria-label="Sternsystem wird geladen"><span></span><span></span><span></span></div>';

  try {
    const system = await server.call('getSystem', DEFAULT_SYSTEM);
    renderSystem({ server, system, list, panel, heading, badge });
  } catch (error) {
    renderError(panel, list, error.message);
  }
}

function renderSystem({ server, system, list, panel, heading, badge }) {
  heading.textContent = `Sternsystem ${system.galaxy}:${system.system}`;
  badge.textContent = system.star.label;
  badge.className = `badge badge--${starTone(system.star.key)}`;
  list.innerHTML = system.positions.map((entry) => positionMarkup(entry)).join('');

  list.querySelectorAll('[data-action="colonize-position"]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Kolonisiert …';

      try {
        const colony = await server.call('colonize', {
          galaxy: system.galaxy,
          system: system.system,
          position: Number(button.dataset.position),
        });
        const updatedSystem = await server.call('getSystem', {
          galaxy: system.galaxy,
          system: system.system,
        });
        renderSystem({ server, system: updatedSystem, list, panel, heading, badge });
        renderNotice(panel, `Kolonisierung erfolgreich: ${colony.name} besitzt ${colony.fields} Felder.`, 'success');
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Kolonisieren';
        renderNotice(panel, error.message, 'danger');
      }
    });
  });
}

function positionMarkup(entry) {
  if (!entry.occupied) {
    return `
      <div class="galaxy-row galaxy-row--free" data-testid="galaxy-position-${entry.position}">
        <span class="galaxy-row__position">${entry.position}</span>
        <span class="planet-dot planet-dot--large planet-dot--unknown" aria-hidden="true"></span>
        <div><strong>Freie Position</strong><small>Eigenschaften werden erst bei Kolonisierung enthüllt.</small></div>
        <span class="galaxy-row__bonus">Unbekannte Welt</span>
        <span class="badge badge--neutral">Frei</span>
        <button class="button button--secondary button--small" type="button" data-action="colonize-position" data-position="${entry.position}" data-testid="colonize-${entry.position}">Kolonisieren</button>
      </div>
    `;
  }

  const colony = entry.colony;
  const resourceBonus = colony.bonuses.resource
    ? resourceValueMarkup(colony.bonuses.resource.resource, formatPercent(colony.bonuses.resource.percent))
    : 'Kein Rohstoffbonus';

  return `
    <div class="galaxy-row ${colony.ownedByViewer ? 'galaxy-row--own' : ''}" data-testid="galaxy-position-${entry.position}">
      <span class="galaxy-row__position">${entry.position}</span>
      <span class="planet-dot planet-dot--large planet-dot--${planetTone(colony.planetType)}" aria-hidden="true"></span>
      <div><strong>${escapeHtml(colony.name)}</strong><small>${escapeHtml(colony.planetType)} · ${colony.fields} Felder · ${formatTemperature(colony.temperature)}</small></div>
      <span class="galaxy-row__bonus">${resourceValueMarkup('energy', formatPercent(colony.bonuses.solarEnergy))} · ${resourceValueMarkup('deuterium', formatPercent(colony.bonuses.deuterium))}</span>
      <span class="badge badge--${colony.ownedByViewer ? 'info' : 'success'}">${colony.ownedByViewer ? 'Eigener Planet' : escapeHtml(colony.ownerName)}</span>
      <span class="galaxy-row__bonus">${resourceBonus}</span>
    </div>
  `;
}

function renderNotice(panel, message, tone) {
  panel.querySelector('[data-testid="colony-notice"]')?.remove();
  const notice = document.createElement('div');
  notice.className = `alert alert--${tone}`;
  notice.dataset.testid = 'colony-notice';
  notice.innerHTML = `<strong>${tone === 'success' ? 'Erfolgreich' : 'Fehler'}</strong><span>${escapeHtml(message)}</span>`;
  panel.insertBefore(notice, panel.querySelector('.galaxy-list'));
}

function renderError(panel, list, message) {
  list.innerHTML = '';
  renderNotice(panel, message, 'danger');
}

function formatTemperature(temperature) {
  return `${temperature.min} bis ${temperature.max} °C`;
}

function formatPercent(value) {
  return `${value >= 0 ? '+' : ''}${value}%`;
}

function starTone(starKey) {
  if (starKey === 'blue') return 'info';
  if (starKey === 'red') return 'danger';
  if (starKey === 'white') return 'neutral';
  return 'warning';
}

function planetTone(planetType) {
  if (planetType === 'Eiswelt') return 'ice';
  if (planetType === 'Vulkanwelt') return 'volcanic';
  if (planetType === 'Wüstenwelt') return 'desert';
  if (planetType === 'Ozeanwelt') return 'ocean';
  return 'terran';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
