import { bindGameEvents } from './game-ui-events.js';
import { renderGameShell } from './game-ui-shell.js';

export async function mountGameFeature({ root, server, user, onLogout }) {
  const model = {
    state: null, detail: null, galaxy: null, research: null, view: 'overview', notice: null,
    galaxyNotice: null, loading: false, menuOpen: false,
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
  }

  async function perform(operation, successText) {
    if (model.loading) return;
    model.loading = true;
    root.querySelectorAll('button, select').forEach((element) => { element.disabled = true; });
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
      if (view === 'galaxy') {
        try { await loadGalaxy(); } catch (error) { model.galaxyNotice = { tone: 'danger', text: error.message }; }
      }
      if (view === 'research') {
        try { await loadResearch(); } catch (error) { model.notice = { tone: 'danger', text: error.message }; }
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
