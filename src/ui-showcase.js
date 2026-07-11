const resources = [
  { key: 'metal', label: 'Metall', value: '12.480', delta: '+1.248/h', icon: 'M' },
  { key: 'crystal', label: 'Kristall', value: '8.320', delta: '+832/h', icon: 'K' },
  { key: 'deuterium', label: 'Deuterium', value: '4.160', delta: '+416/h', icon: 'D' },
  { key: 'energy', label: 'Energie', value: '1.540', delta: '+320', icon: 'E' },
];

const menuItems = [
  ['overview', 'Übersicht', '⌂'],
  ['resources', 'Rohstoffe', '◆'],
  ['facilities', 'Anlagen', '▦'],
  ['research', 'Forschung', '⌬'],
  ['shipyard', 'Werft', '△'],
  ['defense', 'Verteidigung', '⬡'],
  ['fleet', 'Flotte', '➤'],
  ['galaxy', 'Galaxie', '✦'],
  ['empire', 'Imperium', '◎'],
  ['alliance', 'Allianz', '◇'],
  ['messages', 'Nachrichten', '✉'],
];

export function renderUiShowcase(user) {
  const username = escapeHtml(user.username);

  return `
    <div class="game-shell" data-testid="ui-showcase">
      <header class="topbar">
        <div class="topbar__brand">
          <button class="icon-button topbar__menu-toggle" type="button" aria-controls="main-menu" aria-expanded="false" data-testid="mobile-menu-toggle" title="Hauptmenü öffnen">
            <span aria-hidden="true">☰</span>
            <span class="sr-only">Hauptmenü öffnen</span>
          </button>
          <a class="brand-mark" href="#overview" aria-label="XNOVA Übersicht">
            <span class="brand-mark__orb" aria-hidden="true"></span>
            <span><strong>XNOVA</strong><small>UI Laboratory</small></span>
          </a>
        </div>

        <div class="resource-strip" aria-label="Ressourcenübersicht">
          ${resources.map(resourceMarkup).join('')}
          <div class="resource-item resource-item--storage" title="Gesamtauslastung der Lager">
            <span class="resource-item__icon" aria-hidden="true">▤</span>
            <span><small>Lager</small><strong>62%</strong></span>
            <span class="mini-meter" aria-hidden="true"><span style="width: 62%"></span></span>
          </div>
        </div>

        <div class="topbar__actions">
          <button class="icon-button has-indicator" type="button" title="Nachrichten">
            <span aria-hidden="true">✉</span><span class="sr-only">Nachrichten</span><span class="indicator">3</span>
          </button>
          <button class="icon-button" type="button" data-testid="logout-button" title="Ausloggen">
            <span aria-hidden="true">↪</span><span class="sr-only">Ausloggen</span>
          </button>
          <details class="user-menu">
            <summary>
              <span class="avatar" aria-hidden="true">${escapeHtml(username.slice(0, 1).toUpperCase())}</span>
              <span class="user-menu__label"><strong>${username}</strong><small>Commander</small></span>
              <span aria-hidden="true">▾</span>
            </summary>
            <div class="user-menu__popover">
              <button type="button">Profil</button>
              <button type="button">Einstellungen</button>
              <button type="button" data-action="logout">Ausloggen</button>
            </div>
          </details>
        </div>
      </header>

      <aside class="sidebar" id="main-menu" aria-label="Hauptnavigation">
        <div class="planet-switcher">
          <div class="planet-visual planet-visual--small" aria-hidden="true"></div>
          <label>
            <span>Aktiver Planet</span>
            <select aria-label="Aktiver Planet">
              <option>Nova Prime [1:24:8]</option>
              <option>Luna Outpost [1:24:12]</option>
              <option>Helios [2:18:4]</option>
            </select>
          </label>
        </div>

        <nav class="main-menu">
          ${menuItems.map(([key, label, icon], index) => `
            <a href="#${key}" class="main-menu__item${index === 0 ? ' is-active' : ''}" data-menu-item="${key}">
              <span class="main-menu__icon" aria-hidden="true">${icon}</span>
              <span>${label}</span>
              ${key === 'messages' ? '<span class="menu-badge">3</span>' : ''}
            </a>
          `).join('')}
        </nav>

        <div class="sidebar__footer">
          <div class="status-dot"><span></span> Lokaler Spielserver aktiv</div>
          <small>Singleplayer · IndexedDB</small>
        </div>
      </aside>

      <main class="game-content" id="overview">
        <div class="content-heading">
          <div>
            <div class="breadcrumbs" aria-label="Brotkrumen-Navigation">
              <a href="#overview">Imperium</a><span>/</span><span>UI-Komponenten</span>
            </div>
            <p class="eyebrow">Kommandobrücke</p>
            <h1 data-testid="greeting">Hallo ${username}, du bist eingeloggt.</h1>
            <p class="lead">Eine interaktive Referenzseite für das XNova-Interface und alle zentralen Spielzustände.</p>
          </div>
          <div class="content-heading__actions">
            <button class="button button--secondary" type="button" data-action="show-toast">Vorschau speichern</button>
            <button class="button button--primary" type="button" data-action="open-dialog">Dialog öffnen</button>
          </div>
        </div>

        <nav class="section-tabs" aria-label="Komponentenbereiche">
          <button class="section-tab is-active" type="button" data-tab="components">Komponenten</button>
          <button class="section-tab" type="button" data-tab="gameplay">Gameplay</button>
          <button class="section-tab" type="button" data-tab="states">Zustände</button>
        </nav>

        <section class="dashboard-grid" aria-label="Imperiumsstatus">
          <article class="stat-card">
            <span class="stat-card__icon">◉</span>
            <div><small>Planeten</small><strong>3 / 7</strong><span>2 Kolonien aktiv</span></div>
          </article>
          <article class="stat-card">
            <span class="stat-card__icon">➤</span>
            <div><small>Flotten</small><strong>4 / 8</strong><span>2 unterwegs</span></div>
          </article>
          <article class="stat-card">
            <span class="stat-card__icon">⌬</span>
            <div><small>Forschung</small><strong>Stufe 6</strong><span>Plasmatechnik</span></div>
          </article>
          <article class="stat-card stat-card--warning">
            <span class="stat-card__icon">!</span>
            <div><small>Bauauftrag</small><strong>08:42</strong><span>Metallmine 18</span></div>
          </article>
        </section>

        <div data-tab-panel="components">
          <section class="component-section" id="controls">
            <div class="section-heading">
              <div><p class="eyebrow">01 · Grundlagen</p><h2>Aktionen und Auswahl</h2></div>
              <span class="section-note">Hover, Focus, Active, Disabled und Loading</span>
            </div>

            <div class="component-grid component-grid--two">
              <article class="component-panel">
                <div class="panel-heading"><h3>Buttons</h3><span class="badge badge--neutral">5 Varianten</span></div>
                <div class="button-row">
                  <button class="button button--primary" type="button">Primäraktion</button>
                  <button class="button button--secondary" type="button">Sekundär</button>
                  <button class="button button--ghost" type="button">Ghost</button>
                  <button class="button button--danger" type="button">Abbrechen</button>
                  <button class="button button--primary" type="button" disabled>Deaktiviert</button>
                  <button class="button button--primary is-loading" type="button" aria-busy="true"><span class="spinner"></span>Lädt</button>
                  <button class="icon-button" type="button" title="Favorisieren"><span aria-hidden="true">☆</span><span class="sr-only">Favorisieren</span></button>
                </div>
              </article>

              <article class="component-panel">
                <div class="panel-heading"><h3>Chips und Status</h3><span class="badge badge--success">Online</span></div>
                <div class="chip-row" aria-label="Filter">
                  <button class="chip is-selected" type="button" aria-pressed="true">Alle</button>
                  <button class="chip" type="button" aria-pressed="false">Gebäude</button>
                  <button class="chip" type="button" aria-pressed="false">Forschung</button>
                  <button class="chip" type="button" aria-pressed="false">Flotten</button>
                </div>
                <div class="status-row">
                  <span class="badge badge--success">Bereit</span>
                  <span class="badge badge--warning">In Arbeit</span>
                  <span class="badge badge--danger">Blockiert</span>
                  <span class="badge badge--info">Neu</span>
                  <span class="badge badge--neutral">Inaktiv</span>
                </div>
              </article>

              <article class="component-panel">
                <div class="panel-heading"><h3>Form Controls</h3><span class="badge badge--info">Interaktiv</span></div>
                <div class="form-grid">
                  <label class="field">
                    <span>Planetenname</span>
                    <input type="text" value="Nova Prime" />
                    <small>3–20 Zeichen</small>
                  </label>
                  <label class="field">
                    <span>Sektor</span>
                    <select>
                      <option>Alpha-Sektor</option>
                      <option>Beta-Sektor</option>
                      <option>Gamma-Sektor</option>
                    </select>
                  </label>
                  <label class="field field--full">
                    <span>Koordinaten</span>
                    <div class="input-group"><span>[</span><input type="number" value="1" min="1" max="9" aria-label="Galaxie" /><span>:</span><input type="number" value="24" min="1" max="499" aria-label="System" /><span>:</span><input type="number" value="8" min="1" max="15" aria-label="Position" /><span>]</span></div>
                  </label>
                  <label class="field field--full">
                    <span>Flottengeschwindigkeit <output id="speed-output">80%</output></span>
                    <input id="speed-range" type="range" min="10" max="100" step="10" value="80" />
                  </label>
                </div>
              </article>

              <article class="component-panel">
                <div class="panel-heading"><h3>Checkbox, Radio und Switch</h3></div>
                <div class="option-stack">
                  <label class="check-control"><input type="checkbox" checked /><span>Nach Abschluss benachrichtigen</span></label>
                  <label class="check-control"><input type="checkbox" /><span>Ressourcen automatisch verteilen</span></label>
                  <fieldset class="radio-group">
                    <legend>Missionspriorität</legend>
                    <label class="check-control"><input type="radio" name="priority" checked /><span>Standard</span></label>
                    <label class="check-control"><input type="radio" name="priority" /><span>Schnell</span></label>
                    <label class="check-control"><input type="radio" name="priority" /><span>Sparsam</span></label>
                  </fieldset>
                  <label class="switch-control"><input type="checkbox" checked /><span class="switch-track"></span><span>Kompakte Ressourcenleiste</span></label>
                </div>
              </article>
            </div>
          </section>

          <section class="component-section" id="data-display">
            <div class="section-heading"><div><p class="eyebrow">02 · Daten</p><h2>Tabellen, Listen und Fortschritt</h2></div></div>
            <div class="component-grid component-grid--wide">
              <article class="component-panel component-panel--table">
                <div class="panel-heading"><h3>Planetenübersicht</h3><button class="button button--ghost button--small" type="button">Exportieren</button></div>
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Planet</th>
                        <th><button class="table-sort" type="button" data-sort="metal" aria-label="Tabellenzeile nach Metall sortieren">Metall ↕</button></th>
                        <th>Kristall</th><th>Deuterium</th><th>Energie</th><th>Status</th><th><span class="sr-only">Aktionen</span></th>
                      </tr>
                    </thead>
                    <tbody data-testid="planet-table-body">
                      ${planetRow('Nova Prime', '[1:24:8]', 12480, 8320, 4160, 1540, 'Aktiv', 'success')}
                      ${planetRow('Luna Outpost', '[1:24:12]', 4210, 6800, 2980, 740, 'Bauauftrag', 'warning')}
                      ${planetRow('Helios', '[2:18:4]', 18800, 9340, 5220, 2140, 'Aktiv', 'success')}
                    </tbody>
                  </table>
                </div>
                <div class="pagination" aria-label="Tabellennavigation"><button type="button" disabled>‹</button><button type="button" class="is-active">1</button><button type="button">2</button><button type="button">3</button><button type="button">›</button></div>
              </article>

              <article class="component-panel">
                <div class="panel-heading"><h3>Kapazitäten</h3><span class="badge badge--warning">1 Warnung</span></div>
                <div class="meter-list">
                  ${meterMarkup('Metalllager', '124.800 / 200.000', 62, '')}
                  ${meterMarkup('Kristalllager', '83.200 / 100.000', 83, 'warning')}
                  ${meterMarkup('Deuteriumtank', '41.600 / 100.000', 42, '')}
                  ${meterMarkup('Planetenfelder', '142 / 163', 87, 'danger')}
                </div>
              </article>
            </div>
          </section>

          <section class="component-section" id="feedback">
            <div class="section-heading"><div><p class="eyebrow">03 · Feedback</p><h2>Meldungen und Zustände</h2></div></div>
            <div class="component-grid component-grid--two">
              <article class="component-panel">
                <div class="alert alert--info"><strong>Hinweis</strong><span>Die Produktion wird alle 60 Sekunden aktualisiert.</span><button type="button" aria-label="Hinweis schließen">×</button></div>
                <div class="alert alert--success"><strong>Erfolgreich</strong><span>Forschung wurde der Warteschlange hinzugefügt.</span></div>
                <div class="alert alert--warning"><strong>Warnung</strong><span>Das Kristalllager ist bald voll.</span></div>
                <div class="alert alert--danger"><strong>Fehler</strong><span>Nicht genügend Deuterium für diese Mission.</span></div>
              </article>
              <article class="component-panel">
                <div class="panel-heading"><h3>Loading und Empty State</h3></div>
                <div class="skeleton-list" aria-label="Ladeplatzhalter"><span></span><span></span><span></span></div>
                <div class="empty-state"><span class="empty-state__icon" aria-hidden="true">◎</span><strong>Keine Spionageberichte</strong><p>Neue Berichte erscheinen hier, sobald eine Sonde ihr Ziel erreicht.</p><button class="button button--secondary button--small" type="button">Galaxie öffnen</button></div>
              </article>
            </div>
          </section>
        </div>

        <div data-tab-panel="gameplay" hidden>
          <section class="component-section">
            <div class="section-heading"><div><p class="eyebrow">04 · Gameplay</p><h2>Gebäude und Forschung</h2></div><button class="button button--secondary button--small" type="button">Alle Gebäude</button></div>
            <div class="game-card-grid">
              ${buildingCard({ id: 'metal-mine', title: 'Metallmine', level: 17, description: 'Fördert Metall, den wichtigsten Grundstoff des Imperiums.', metal: '18.420', crystal: '4.610', duration: '08:42', progress: 68, status: 'Ausbau läuft' })}
              ${buildingCard({ id: 'crystal-mine', title: 'Kristallmine', level: 15, description: 'Liefert Kristall für Elektronik und komplexe Legierungen.', metal: '12.600', crystal: '6.300', duration: '05:10', progress: 0, status: 'Bereit' })}
              ${buildingCard({ id: 'research-lab', title: 'Forschungslabor', level: 10, description: 'Schaltet neue Technologien und Forschungen frei.', metal: '32.000', crystal: '48.000', duration: '21:30', progress: 0, status: 'Voraussetzung fehlt', locked: true })}
            </div>
          </section>

          <section class="component-section">
            <div class="section-heading"><div><p class="eyebrow">05 · Produktion</p><h2>Warteschlange und Kosten</h2></div></div>
            <div class="component-grid component-grid--two">
              <article class="component-panel">
                <div class="panel-heading"><h3>Bauwarteschlange</h3><span class="badge badge--info">2 Aufträge</span></div>
                <div class="queue-list">
                  <div class="queue-item" data-queue-item>
                    <span class="queue-item__position">1</span><div class="queue-item__art">M</div>
                    <div class="queue-item__content"><strong>Metallmine · Stufe 18</strong><span>Fertig in 08:42</span><span class="progress"><span style="width:68%"></span></span></div>
                    <button class="icon-button icon-button--danger" type="button" data-action="cancel-queue" aria-label="Bauauftrag Metallmine abbrechen">×</button>
                  </div>
                  <div class="queue-item" data-queue-item>
                    <span class="queue-item__position">2</span><div class="queue-item__art">S</div>
                    <div class="queue-item__content"><strong>Solarkraftwerk · Stufe 16</strong><span>Beginnt anschließend</span><span class="progress"><span style="width:0%"></span></span></div>
                    <button class="icon-button icon-button--danger" type="button" data-action="cancel-queue" aria-label="Bauauftrag Solarkraftwerk abbrechen">×</button>
                  </div>
                </div>
              </article>

              <article class="component-panel">
                <div class="panel-heading"><h3>Voraussetzungen</h3><span class="badge badge--danger">1 fehlt</span></div>
                <ul class="requirement-list">
                  <li class="is-complete"><span>✓</span><div><strong>Forschungslabor</strong><small>Benötigt Stufe 8 · Vorhanden 10</small></div></li>
                  <li class="is-complete"><span>✓</span><div><strong>Energietechnik</strong><small>Benötigt Stufe 5 · Vorhanden 7</small></div></li>
                  <li class="is-missing"><span>×</span><div><strong>Plasmatechnik</strong><small>Benötigt Stufe 7 · Vorhanden 6</small></div></li>
                </ul>
              </article>
            </div>
          </section>

          <section class="component-section">
            <div class="section-heading"><div><p class="eyebrow">06 · Flotten</p><h2>Mission und Galaxie</h2></div></div>
            <div class="component-grid component-grid--two">
              <article class="component-panel">
                <div class="panel-heading"><h3>Flottenplaner</h3><span class="badge badge--success">Startbereit</span></div>
                <div class="fleet-composition">
                  ${shipInput('Kleiner Transporter', 25, 120)}
                  ${shipInput('Großer Transporter', 10, 48)}
                  ${shipInput('Leichter Jäger', 40, 310)}
                  ${shipInput('Spionagesonde', 5, 80)}
                </div>
                <div class="fleet-summary">
                  <div><small>Kapazität</small><strong>625.000</strong></div><div><small>Flugzeit</small><strong>00:18:42</strong></div><div><small>Verbrauch</small><strong>1.284 D</strong></div>
                </div>
                <button class="button button--primary button--block" type="button">Mission konfigurieren</button>
              </article>

              <article class="component-panel">
                <div class="panel-heading"><h3>Galaxiezeile</h3><span class="badge badge--neutral">System 1:24</span></div>
                <div class="galaxy-list">
                  ${galaxyRow('7', 'Aurelia', 'Commander Vega', 'NOVA', 'active')}
                  ${galaxyRow('8', 'Nova Prime', username, 'XN', 'own')}
                  ${galaxyRow('9', 'Draco IV', 'Silent Hunter', 'VOID', 'inactive')}
                </div>
              </article>
            </div>
          </section>
        </div>

        <div data-tab-panel="states" hidden>
          <section class="component-section">
            <div class="section-heading"><div><p class="eyebrow">07 · Zustände</p><h2>Component State Matrix</h2></div></div>
            <div class="state-matrix">
              <article><span class="state-swatch state-swatch--default"></span><strong>Default</strong><small>Neutraler Ausgangszustand</small></article>
              <article><span class="state-swatch state-swatch--focus"></span><strong>Focus</strong><small>Tastaturfokus sichtbar</small></article>
              <article><span class="state-swatch state-swatch--selected"></span><strong>Selected</strong><small>Aktive Auswahl</small></article>
              <article><span class="state-swatch state-swatch--loading"></span><strong>Loading</strong><small>Aktion wird verarbeitet</small></article>
              <article><span class="state-swatch state-swatch--success"></span><strong>Success</strong><small>Erfolgreich abgeschlossen</small></article>
              <article><span class="state-swatch state-swatch--warning"></span><strong>Warning</strong><small>Aufmerksamkeit nötig</small></article>
              <article><span class="state-swatch state-swatch--danger"></span><strong>Error</strong><small>Aktion fehlgeschlagen</small></article>
              <article><span class="state-swatch state-swatch--disabled"></span><strong>Disabled</strong><small>Nicht verfügbar</small></article>
            </div>
            <details class="accordion" open><summary>Accessibility-Checkliste <span>＋</span></summary><div><p>Alle interaktiven Controls besitzen sichtbare Fokuszustände, verständliche Labels und ausreichende Kontraste. Tabellen, Dialoge und Navigation verwenden semantische HTML-Elemente.</p></div></details>
            <details class="accordion"><summary>Responsive Verhalten <span>＋</span></summary><div><p>Die Ressourcenleiste wird auf kleinen Displays horizontal scrollbar. Das Hauptmenü wechselt in ein ausblendbares Overlay und Tabellen bleiben horizontal bedienbar.</p></div></details>
          </section>
        </div>
      </main>

      <dialog class="demo-dialog" data-testid="demo-dialog">
        <form method="dialog">
          <div class="dialog-visual" aria-hidden="true">⚠</div>
          <h2>Auftrag bestätigen?</h2>
          <p>Der Ausbau der Kristallmine kostet 12.600 Metall und 6.300 Kristall.</p>
          <div class="cost-row"><span class="cost cost--metal">M 12.600</span><span class="cost cost--crystal">K 6.300</span></div>
          <div class="dialog-actions"><button class="button button--ghost" value="cancel">Abbrechen</button><button class="button button--primary" value="confirm" data-dialog-confirm>Bestätigen</button></div>
        </form>
      </dialog>

      <div class="toast-region" aria-live="polite" aria-atomic="true"></div>
      <div class="mobile-backdrop" data-action="close-menu"></div>
    </div>
  `;
}

export function bindUiShowcase({ onLogout }) {
  const shell = document.querySelector('.game-shell');
  if (!shell) return;

  const sidebar = shell.querySelector('.sidebar');
  const menuToggle = shell.querySelector('[data-testid="mobile-menu-toggle"]');
  const backdrop = shell.querySelector('.mobile-backdrop');
  const dialog = shell.querySelector('.demo-dialog');
  const toastRegion = shell.querySelector('.toast-region');
  let sortAscending = true;

  const setMenuOpen = (open) => {
    shell.classList.toggle('is-menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    sidebar.setAttribute('aria-hidden', String(!open && window.matchMedia('(max-width: 70rem)').matches));
  };

  menuToggle.addEventListener('click', () => setMenuOpen(!shell.classList.contains('is-menu-open')));
  backdrop.addEventListener('click', () => setMenuOpen(false));

  shell.querySelectorAll('[data-menu-item]').forEach((item) => {
    item.addEventListener('click', () => {
      shell.querySelectorAll('[data-menu-item]').forEach((entry) => entry.classList.remove('is-active'));
      item.classList.add('is-active');
      setMenuOpen(false);
    });
  });

  shell.querySelectorAll('.section-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      shell.querySelectorAll('.section-tab').forEach((entry) => entry.classList.toggle('is-active', entry === tab));
      shell.querySelectorAll('[data-tab-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== target;
      });
    });
  });

  shell.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const selected = chip.getAttribute('aria-pressed') !== 'true';
      chip.setAttribute('aria-pressed', String(selected));
      chip.classList.toggle('is-selected', selected);
    });
  });

  const speedRange = shell.querySelector('#speed-range');
  const speedOutput = shell.querySelector('#speed-output');
  speedRange.addEventListener('input', () => { speedOutput.value = `${speedRange.value}%`; });

  shell.querySelector('[data-sort="metal"]').addEventListener('click', () => {
    const tbody = shell.querySelector('[data-testid="planet-table-body"]');
    const rows = [...tbody.querySelectorAll('tr')];
    rows.sort((a, b) => {
      const first = Number(a.dataset.metal);
      const second = Number(b.dataset.metal);
      return sortAscending ? first - second : second - first;
    });
    rows.forEach((row) => tbody.append(row));
    sortAscending = !sortAscending;
  });

  shell.querySelectorAll('[data-action="open-dialog"]').forEach((button) => {
    button.addEventListener('click', () => dialog.showModal());
  });

  shell.querySelector('[data-dialog-confirm]').addEventListener('click', () => {
    showToast(toastRegion, 'Auftrag wurde erfolgreich vorgemerkt.', 'success');
  });

  shell.querySelectorAll('[data-action="show-toast"]').forEach((button) => {
    button.addEventListener('click', () => showToast(toastRegion, 'UI-Vorschau wurde lokal gespeichert.', 'info'));
  });

  shell.querySelectorAll('[data-action="cancel-queue"]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('[data-queue-item]').remove();
      showToast(toastRegion, 'Bauauftrag wurde aus der Warteschlange entfernt.', 'warning');
    });
  });

  shell.querySelectorAll('[data-action="upgrade-building"]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('[data-building-card]');
      const level = card.querySelector('[data-building-level]');
      const nextLevel = Number(level.textContent) + 1;
      level.textContent = String(nextLevel);
      button.textContent = `Stufe ${nextLevel + 1} ausbauen`;
      showToast(toastRegion, `${card.dataset.buildingName} wurde auf Stufe ${nextLevel} gesetzt.`, 'success');
    });
  });

  shell.querySelectorAll('[data-testid="logout-button"], [data-action="logout"]').forEach((button) => button.addEventListener('click', onLogout));
}

function resourceMarkup(resource) {
  return `
    <div class="resource-item" data-testid="resource-${resource.key}" title="${resource.delta}">
      <span class="resource-item__icon resource-item__icon--${resource.key}" aria-hidden="true">${resource.icon}</span>
      <span><small>${resource.label}</small><strong>${resource.value}</strong></span>
      <span class="resource-item__delta">${resource.delta}</span>
    </div>
  `;
}

function planetRow(name, coords, metal, crystal, deuterium, energy, status, tone) {
  return `
    <tr data-metal="${metal}">
      <td><div class="planet-cell"><span class="planet-dot" aria-hidden="true"></span><span><strong>${name}</strong><small>${coords}</small></span></div></td>
      <td>${formatNumber(metal)}</td><td>${formatNumber(crystal)}</td><td>${formatNumber(deuterium)}</td><td>${formatNumber(energy)}</td>
      <td><span class="badge badge--${tone}">${status}</span></td>
      <td><button class="icon-button icon-button--small" type="button" aria-label="Aktionen für ${name}">⋯</button></td>
    </tr>
  `;
}

function meterMarkup(label, value, progress, tone) {
  return `
    <div class="meter-item">
      <div><strong>${label}</strong><span>${value}</span></div>
      <span class="progress ${tone ? `progress--${tone}` : ''}"><span style="width:${progress}%"></span></span>
    </div>
  `;
}

function buildingCard({ id, title, level, description, metal, crystal, duration, progress, status, locked = false }) {
  return `
    <article class="game-card ${locked ? 'is-locked' : ''}" data-building-card data-building-name="${title}">
      <div class="game-card__visual game-card__visual--${id}"><span>${title.slice(0, 1)}</span><span class="level-badge">Lv. <strong data-building-level>${level}</strong></span></div>
      <div class="game-card__body">
        <div class="panel-heading"><h3>${title}</h3><span class="badge badge--${locked ? 'danger' : progress ? 'warning' : 'success'}">${status}</span></div>
        <p>${description}</p>
        <div class="cost-row"><span class="cost cost--metal">M ${metal}</span><span class="cost cost--crystal">K ${crystal}</span><span class="cost cost--time">◷ ${duration}</span></div>
        ${progress ? `<span class="progress"><span style="width:${progress}%"></span></span>` : ''}
        <button class="button ${locked ? 'button--secondary' : 'button--primary'} button--block" type="button" data-action="upgrade-building" ${locked ? 'disabled' : ''}>${locked ? 'Voraussetzungen prüfen' : `Stufe ${level + 1} ausbauen`}</button>
      </div>
    </article>
  `;
}

function shipInput(label, value, max) {
  return `<label class="ship-row"><span>${label}<small>${max} verfügbar</small></span><input type="number" min="0" max="${max}" value="${value}" /></label>`;
}

function galaxyRow(position, planet, player, alliance, state) {
  const stateLabel = state === 'own' ? 'Eigener Planet' : state === 'inactive' ? 'Inaktiv' : 'Aktiv';
  return `
    <div class="galaxy-row galaxy-row--${state}">
      <span class="galaxy-row__position">${position}</span><span class="planet-dot planet-dot--large" aria-hidden="true"></span>
      <div><strong>${planet}</strong><small>${player}</small></div><a href="#alliance">[${alliance}]</a><span class="badge badge--${state === 'inactive' ? 'neutral' : state === 'own' ? 'info' : 'success'}">${stateLabel}</span>
      <button class="icon-button icon-button--small" type="button" aria-label="Aktionen für ${planet}">⋯</button>
    </div>
  `;
}

function showToast(region, text, tone) {
  region.innerHTML = `<div class="toast toast--${tone}" data-testid="toast"><span>${tone === 'success' ? '✓' : tone === 'warning' ? '!' : 'i'}</span><div><strong>${tone === 'success' ? 'Erfolgreich' : tone === 'warning' ? 'Hinweis' : 'Gespeichert'}</strong><p>${text}</p></div><button type="button" aria-label="Benachrichtigung schließen">×</button></div>`;
  const toast = region.firstElementChild;
  toast.querySelector('button').addEventListener('click', () => toast.remove());
  window.setTimeout(() => toast.remove(), 5000);
}

function formatNumber(value) {
  return new Intl.NumberFormat('de-DE').format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
