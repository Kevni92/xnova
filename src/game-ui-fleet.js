import { escapeHtml, formatDuration, formatNumber, resourceIconMarkup, resourceValueMarkup } from './game-ui-format.js';

export function fleetMarkup(fleet) {
  if (!fleet) return '<section class="component-section"><p>Flottendaten werden geladen …</p></section>';
  const [galaxy, system] = fleet.coordinates.split(':').map(Number);
  const ownTargets = fleet.ownPlanets.filter((planet) => planet.coordinates !== fleet.coordinates);
  return `
    <div class="content-heading"><div><div class="breadcrumbs"><a href="#overview" data-view="overview">Imperium</a><span>/</span><span>Flotte</span></div><p class="eyebrow">Flottenkommando</p><h1>Flotte entsenden</h1><p class="lead">Wähle Schiffe, Ziel, Geschwindigkeit und Fracht. Transport liefert Rohstoffe und kehrt zurück; Stationierung verlegt Schiffe dauerhaft auf einen eigenen Planeten.</p></div></div>
    <section class="research-summary" aria-label="Flottenstatus">
      <article><small>Startplanet</small><strong>${escapeHtml(fleet.originName)} [${escapeHtml(fleet.coordinates)}]</strong></article>
      <article><small>Flottenslots</small><strong>${fleet.slots.used} / ${fleet.slots.maximum}</strong></article>
      <article><small>Schiffe verfügbar</small><strong>${formatNumber(fleet.ships.reduce((sum, ship) => sum + ship.available, 0))}</strong></article>
      <article><small>Aktive Flotten</small><strong>${fleet.activeFleets.length}</strong></article>
    </section>
    ${activeFleetsMarkup(fleet.activeFleets)}
    <form class="fleet-planner" data-action="launch-fleet" data-fleet-form data-origin="${escapeHtml(fleet.coordinates)}" data-metal="${fleet.resources.metal}" data-crystal="${fleet.resources.crystal}" data-deuterium="${fleet.resources.deuterium}">
      <section class="component-panel fleet-step"><div class="fleet-step__number">1</div><div class="fleet-step__body"><div class="section-heading"><div><p class="eyebrow">Schritt 1</p><h2>Schiffe auswählen</h2></div><span class="section-note">Nur Schiffe am Startplaneten</span></div><div class="fleet-ship-grid">${fleet.ships.map(fleetShipInput).join('')}</div></div></section>
      <section class="component-panel fleet-step"><div class="fleet-step__number">2</div><div class="fleet-step__body"><div class="section-heading"><div><p class="eyebrow">Schritt 2</p><h2>Ziel und Geschwindigkeit</h2></div></div>
        ${ownTargets.length ? `<label class="field field--full"><span>Eigenen Planeten übernehmen</span><select data-fleet-own-target><option value="">Manuelle Koordinaten</option>${ownTargets.map((planet) => `<option value="${escapeHtml(planet.coordinates)}">${escapeHtml(planet.name)} [${escapeHtml(planet.coordinates)}]</option>`).join('')}</select></label>` : ''}
        <div class="fleet-target-grid"><label class="field"><span>Galaxie</span><input name="galaxy" type="number" min="1" step="1" value="${galaxy}" required /></label><label class="field"><span>System</span><input name="system" type="number" min="1" step="1" value="${system}" required /></label><label class="field"><span>Position</span><input name="position" type="number" min="1" step="1" required /></label><label class="field"><span>Geschwindigkeit</span><select name="speedPercent">${[100,90,80,70,60,50,40,30,20,10].map((value) => `<option value="${value}">${value} %</option>`).join('')}</select></label></div>
      </div></section>
      <section class="component-panel fleet-step"><div class="fleet-step__number">3</div><div class="fleet-step__body"><div class="section-heading"><div><p class="eyebrow">Schritt 3</p><h2>Mission und Fracht</h2></div></div>
        <fieldset class="fleet-missions"><legend>Mission</legend><label class="mission-option"><input type="radio" name="mission" value="transport" checked /><span><strong>Transport</strong><small>Fracht abliefern und zum Startplaneten zurückkehren.</small></span></label><label class="mission-option"><input type="radio" name="mission" value="station" /><span><strong>Stationierung</strong><small>Schiffe und Fracht auf einen eigenen Planeten verlegen.</small></span></label></fieldset>
        <div class="fleet-cargo-grid">${cargoInput('metal', 'Metall', fleet.resources.metal)}${cargoInput('crystal', 'Kristall', fleet.resources.crystal)}${cargoInput('deuterium', 'Deuterium', fleet.resources.deuterium)}</div>
        <div class="fleet-preview" aria-live="polite"><span><small>Schiffe</small><strong data-preview-ships>0</strong></span><span><small>Laderaum</small><strong data-preview-capacity>0</strong></span><span><small>Flugzeit</small><strong data-preview-duration>0:00</strong></span><span><small>Treibstoff</small><strong>${resourceIconMarkup('deuterium', { decorative: true })}<output data-preview-fuel>0</output></strong></span></div>
        <p class="fleet-preview__notice" data-preview-notice>Wähle mindestens ein Schiff und ein Ziel.</p>
        <button class="button button--primary fleet-launch" type="submit" ${fleet.slots.used >= fleet.slots.maximum ? 'disabled' : ''}>Flotte starten</button>
      </div></section>
    </form>
    ${reportsMarkup(fleet.reports)}
  `;
}

export function updateFleetPlanner(form) {
  if (!form) return;
  const selected = [...form.querySelectorAll('[data-ship-key]')].map((input) => ({
    quantity: Math.max(0, Math.floor(Number(input.value) || 0)),
    available: Number(input.max) || 0,
    capacity: Number(input.dataset.capacity) || 0,
    speed: Number(input.dataset.speed) || 0,
    consumption: Number(input.dataset.consumption) || 0,
  }));
  const totalShips = selected.reduce((sum, ship) => sum + ship.quantity, 0);
  const capacity = selected.reduce((sum, ship) => sum + ship.quantity * ship.capacity, 0);
  const baseConsumption = selected.reduce((sum, ship) => sum + ship.quantity * ship.consumption, 0);
  const speeds = selected.filter((ship) => ship.quantity > 0).map((ship) => ship.speed);
  const slowestSpeed = speeds.length ? Math.min(...speeds) : 0;
  const cargo = ['metal', 'crystal', 'deuterium'].reduce((sum, key) => sum + Math.max(0, Math.floor(Number(form.elements[`cargo-${key}`]?.value) || 0)), 0);
  const target = `${form.elements.galaxy?.value}:${form.elements.system?.value}:${form.elements.position?.value}`;
  const speedPercent = Number(form.elements.speedPercent?.value) || 100;
  let duration = 0;
  let fuel = 0;
  try {
    const distance = uiDistance(form.dataset.origin, target);
    if (slowestSpeed > 0) {
      duration = Math.max(1, Math.ceil(10 + (35000 / speedPercent) * Math.sqrt((distance * 10) / slowestSpeed)));
      fuel = Math.max(1, Math.ceil(baseConsumption * (distance / 35000) * (speedPercent / 100 + 1) ** 2));
    }
  } catch { duration = 0; fuel = 0; }
  form.querySelector('[data-preview-ships]').textContent = formatNumber(totalShips);
  form.querySelector('[data-preview-capacity]').textContent = formatNumber(capacity);
  form.querySelector('[data-preview-duration]').textContent = formatDuration(duration);
  form.querySelector('[data-preview-fuel]').textContent = formatNumber(fuel);
  const invalidShips = selected.some((ship) => ship.quantity > ship.available);
  const deuteriumCargo = Math.max(0, Math.floor(Number(form.elements['cargo-deuterium']?.value) || 0));
  const enoughFuel = deuteriumCargo + fuel <= Number(form.dataset.deuterium || 0);
  const notice = form.querySelector('[data-preview-notice]');
  if (!totalShips) notice.textContent = 'Wähle mindestens ein Schiff aus.';
  else if (invalidShips) notice.textContent = 'Eine Schiffsauswahl übersteigt den verfügbaren Bestand.';
  else if (cargo > capacity) notice.textContent = 'Die Fracht übersteigt die Ladekapazität.';
  else if (!enoughFuel) notice.textContent = 'Für Fracht und Treibstoff ist nicht genug Deuterium vorhanden.';
  else if (!duration) notice.textContent = 'Gib vollständige Zielkoordinaten an.';
  else notice.textContent = `Bereit: ${formatDuration(duration)} Flugzeit, ${formatNumber(fuel)} Deuterium Treibstoff.`;
}

function fleetShipInput(ship) {
  return `<label class="fleet-ship"><span class="fleet-ship__icon" aria-hidden="true">${escapeHtml(ship.icon)}</span><span><strong>${escapeHtml(ship.name)}</strong><small>${formatNumber(ship.available)} verfügbar · ${formatNumber(ship.cargoCapacity)} Laderaum</small></span><input name="ship-${ship.key}" data-ship-key="${ship.key}" data-capacity="${ship.cargoCapacity}" data-speed="${ship.speed}" data-consumption="${ship.fuelConsumption}" type="number" min="0" max="${ship.available}" step="1" value="0" ${ship.available ? '' : 'disabled'} /></label>`;
}

function cargoInput(key, label, maximum) {
  return `<label class="field"><span>${resourceIconMarkup(key, { decorative: true })}${label}</span><input name="cargo-${key}" type="number" min="0" max="${maximum}" step="1" value="0" /></label>`;
}

function activeFleetsMarkup(fleets) {
  if (!fleets.length) return '<section class="component-panel research-queue research-queue--empty"><div><p class="eyebrow">Flottenbewegungen</p><h2>Keine Flotte unterwegs</h2><p>Freie Slots können für Transport oder Stationierung genutzt werden.</p></div></section>';
  return `<section class="component-section"><div class="section-heading"><div><p class="eyebrow">Flottenbewegungen</p><h2>Aktive Missionen</h2></div><span class="section-note">${fleets.length} unterwegs</span></div><div class="active-fleet-list">${fleets.map(activeFleetMarkup).join('')}</div></section>`;
}

function activeFleetMarkup(fleet) {
  const destination = fleet.phase === 'outbound' ? fleet.targetCoordinates : fleet.originCoordinates;
  return `<article class="component-panel active-fleet" data-testid="fleet-${fleet.id}"><div class="active-fleet__route"><span class="badge badge--info">${escapeHtml(fleet.missionName)}</span><strong>${escapeHtml(fleet.phaseName)} → [${escapeHtml(destination)}]</strong><small>${fleet.shipSummary.map((ship) => `${formatNumber(ship.quantity)} ${escapeHtml(ship.name)}`).join(' · ')}</small></div><div class="active-fleet__cargo">${resourceValueMarkup('metal', formatNumber(fleet.cargo.metal))}${resourceValueMarkup('crystal', formatNumber(fleet.cargo.crystal))}${resourceValueMarkup('deuterium', formatNumber(fleet.cargo.deuterium))}</div><div class="active-fleet__time"><strong>${formatDuration(fleet.remainingSeconds)}</strong><small>verbleibend</small></div>${fleet.canRecall ? `<button class="button button--danger" type="button" data-action="recall-fleet" data-fleet="${fleet.id}">Rückruf</button>` : ''}</article>`;
}

function reportsMarkup(reports) {
  if (!reports.length) return '';
  return `<section class="component-section"><div class="section-heading"><div><p class="eyebrow">Flottenlog</p><h2>Letzte Ereignisse</h2></div></div><div class="fleet-reports">${reports.map((report) => `<article><time>${escapeHtml(new Date(report.createdAt).toLocaleString('de-DE'))}</time><p>${escapeHtml(report.text)}</p></article>`).join('')}</div></section>`;
}

function uiDistance(originValue, targetValue) {
  const origin = originValue.split(':').map(Number);
  const target = targetValue.split(':').map(Number);
  if (origin.length !== 3 || target.length !== 3 || target.some((value) => !Number.isInteger(value) || value < 1)) throw new Error('invalid');
  if (origin[0] !== target[0]) return 20000 * Math.abs(origin[0] - target[0]);
  if (origin[1] !== target[1]) return 2700 + 95 * Math.abs(origin[1] - target[1]);
  return 1000 + 5 * Math.abs(origin[2] - target[2]);
}
