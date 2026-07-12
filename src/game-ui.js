import { bindGameEvents } from './game-ui-events.js';
import { updateFleetPlanner } from './game-ui-fleet.js';
import { renderGameShell } from './game-ui-shell.js';

export async function mountGameFeature({ root, server, user, onLogout }) {
  const model = {
    state: null, detail: null, galaxy: null, research: null, shipyard: null, fleet: null,
    view: 'overview', notice: null, galaxyNotice: null, loading: false, menuOpen: false,
  };

  async function loadGalaxy() {
    const [galaxy, system] = model.state.activePlanet.coordinates.split(':').map(Number);
    model.galaxy = await server.call('getSystem', { galaxy, system });
  }

  async function loadResearch() {
    model.research = await server.call('getResearchState', {
      coordinates: model.state.activePlanet.coordinates,
    });
  }

  async function loadShipyard() {
    model.shipyard = await server.call('getShipyardState', {
      coordinates: model.state.activePlanet.coordinates,
    });
  }

  async function loadFleet() {
    model.fleet = await server.call('getFleetState', {
      coordinates: model.state.activePlanet.coordinates,
    });
  }

  async function refresh({ quiet = false } = {}) {
    if (model.loading) return;
    model.loading = true;
    try {
      model.state = await server.call('getGameState');
      if (model.detail) {
        model.detail = await server.call('getBuildingDetails', {
          coordinates: model.state.activePlanet.coordinates,
          buildingKey: model.detail.key,
        });
      }
      if (model.view === 'galaxy') await loadGalaxy();
      if (model.view === 'research') await loadResearch();
      if (model.view === 'shipyard') await loadShipyard();
      if (model.view === 'fleet') await loadFleet();
      if (!quiet) model.notice = null;
    } catch (error) {
      model.notice = { tone: 'danger', text: error.message };
    } finally {
      model.loading = false;
      render();
    }
  }

  function render() {
    root.innerHTML = renderGameShell(model, user);
    bindGameEvents(root, handlers);
    if (model.view === 'fleet') updateFleetPlanner(root.querySelector('[data-fleet-form]'));
  }

  async function perform(operation, successText) {
    if (model.loading) return;
    model.loading = true;
    root.querySelectorAll('button, select, input').forEach((element) => { element.disabled = true; });
    try {
      await operation();
      model.notice = { tone: 'success', text: successText };
      model.state = await server.call('getGameState');
      if (model.detail) {
        model.detail = await server.call('getBuildingDetails', {
          coordinates: model.state.activePlanet.coordinates,
          buildingKey: model.detail.key,
        });
      }
      if (model.view === 'research') await loadResearch();
      if (model.view === 'shipyard') await loadShipyard();
      if (model.view === 'fleet') await loadFleet();
      if (model.view === 'galaxy') await loadGalaxy();
    } catch (error) {
      model.notice = { tone: 'danger', text: error.message };
    } finally {
      model.loading = false;
      render();
    }
  }

  const handlers = {
    async changeView(view) {
      model.view = view;
      model.detail = null;
      model.menuOpen = false;
      try {
        if (view === 'galaxy') await loadGalaxy();
        if (view === 'research') await loadResearch();
        if (view === 'shipyard') await loadShipyard();
        if (view === 'fleet') await loadFleet();
      } catch (error) {
        if (view === 'galaxy') model.galaxyNotice = { tone: 'danger', text: error.message };
        else model.notice = { tone: 'danger', text: error.message };
      }
      render();
    },
    toggleMenu() { model.menuOpen = !model.menuOpen; render(); },
    logout: onLogout,
    selectPlanet(coordinates) {
      return perform(() => server.call('selectPlanet', { coordinates }), 'Planet gewechselt.');
    },
    async openBuilding(buildingKey) {
      try {
        model.detail = await server.call('getBuildingDetails', {
          coordinates: model.state.activePlanet.coordinates,
          buildingKey,
        });
        model.view = 'detail';
      } catch (error) {
        model.notice = { tone: 'danger', text: error.message };
      }
      render();
    },
    upgradeBuilding(buildingKey, name) {
      return perform(() => server.call('upgradeBuilding', {
        coordinates: model.state.activePlanet.coordinates, buildingKey,
      }), `${name} wurde in die Bauwarteschlange aufgenommen.`);
    },
    demolishBuilding(buildingKey, name) {
      return perform(() => server.call('demolishBuilding', {
        coordinates: model.state.activePlanet.coordinates, buildingKey,
      }), `Abriss von ${name} wurde eingeplant.`);
    },
    cancelJob(jobId) {
      return perform(() => server.call('cancelBuildJob', {
        coordinates: model.state.activePlanet.coordinates, jobId,
      }), 'Bauauftrag abgebrochen. 75 % der Kosten wurden erstattet.');
    },
    startResearch(researchKey, name) {
      return perform(() => server.call('startResearch', {
        coordinates: model.state.activePlanet.coordinates, researchKey,
      }), `${name} wurde gestartet.`);
    },
    cancelResearch() {
      return perform(() => server.call('cancelResearch'), 'Forschung abgebrochen. Die Rohstoffe wurden erstattet.');
    },
    buildShips(shipKey, name, quantity) {
      return perform(() => server.call('buildShips', {
        coordinates: model.state.activePlanet.coordinates, shipKey, quantity,
      }), `${quantity} × ${name} wurde in die Werftwarteschlange aufgenommen.`);
    },
    cancelShipyardJob(jobId) {
      return perform(() => server.call('cancelShipyardJob', {
        coordinates: model.state.activePlanet.coordinates, jobId,
      }), 'Werftauftrag abgebrochen. Offene Einheiten wurden zu 75 % erstattet.');
    },
    launchFleet(payload) {
      const missionName = payload.mission === 'station' ? 'Stationierung' : 'Transport';
      return perform(() => server.call('launchFleet', {
        coordinates: model.state.activePlanet.coordinates,
        ...payload,
      }), `${missionName} wurde gestartet.`);
    },
    recallFleet(fleetId) {
      return perform(() => server.call('recallFleet', { fleetId }), 'Die Flotte wurde zurückgerufen.');
    },
    previewFleet(form) { updateFleetPlanner(form); },
    fillFleetTarget(form, coordinates) {
      const [galaxy, system, position] = coordinates.split(':');
      form.elements.galaxy.value = galaxy;
      form.elements.system.value = system;
      form.elements.position.value = position;
      updateFleetPlanner(form);
    },
    async colonize(position) {
      try {
        const [galaxy, system] = model.state.activePlanet.coordinates.split(':').map(Number);
        await server.call('colonize', { galaxy, system, position });
        model.galaxyNotice = { tone: 'success', text: 'Kolonisierung erfolgreich.' };
        model.state = await server.call('getGameState');
        await loadGalaxy();
      } catch (error) {
        model.galaxyNotice = { tone: 'danger', text: error.message };
      }
      render();
    },
  };

  await refresh();
  const interval = window.setInterval(() => refresh({ quiet: true }), 3000);
  return () => window.clearInterval(interval);
}
