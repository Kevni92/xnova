export function bindGameEvents(root, handlers) {
  root.onclick = async (event) => {
    const target = event.target.closest('button, a');
    if (!target || !root.contains(target)) return;
    if (target.dataset.view) {
      event.preventDefault();
      await handlers.changeView(target.dataset.view);
      return;
    }
    const action = target.dataset.action;
    if (!action) return;
    if (action === 'toggle-menu') handlers.toggleMenu();
    if (action === 'logout') handlers.logout();
    if (action === 'open-building') await handlers.openBuilding(target.dataset.building);
    if (action === 'upgrade-building') await handlers.upgradeBuilding(target.dataset.building, target.dataset.name);
    if (action === 'demolish-building') await handlers.demolishBuilding(target.dataset.building, target.dataset.name);
    if (action === 'cancel-job') await handlers.cancelJob(target.dataset.job);
    if (action === 'start-research') await handlers.startResearch(target.dataset.research, target.dataset.name);
    if (action === 'cancel-research') await handlers.cancelResearch();
    if (action === 'cancel-shipyard-job') await handlers.cancelShipyardJob(target.dataset.job);
    if (action === 'recall-fleet') await handlers.recallFleet(target.dataset.fleet);
    if (action === 'colonize') await handlers.colonize(Number(target.dataset.position));
  };

  root.onsubmit = async (event) => {
    const form = event.target.closest('form[data-action]');
    if (!form || !root.contains(form)) return;
    event.preventDefault();
    if (form.dataset.action === 'build-ships') {
      const data = new FormData(form);
      await handlers.buildShips(form.dataset.ship, form.dataset.name, Number(data.get('quantity')));
    }
    if (form.dataset.action === 'launch-fleet') {
      const data = new FormData(form);
      const ships = Object.fromEntries([...form.querySelectorAll('[data-ship-key]')].map((input) => [input.dataset.shipKey, Number(input.value) || 0]));
      const cargo = Object.fromEntries(['metal', 'crystal', 'deuterium'].map((key) => [key, Number(data.get(`cargo-${key}`)) || 0]));
      await handlers.launchFleet({
        targetCoordinates: {
          galaxy: Number(data.get('galaxy')),
          system: Number(data.get('system')),
          position: Number(data.get('position')),
        },
        mission: data.get('mission'),
        speedPercent: Number(data.get('speedPercent')),
        ships,
        cargo,
      });
    }
  };

  root.oninput = (event) => {
    const form = event.target.closest('[data-fleet-form]');
    if (form) handlers.previewFleet(form);
  };

  root.onchange = async (event) => {
    if (event.target.matches('[data-action="select-planet"]')) {
      await handlers.selectPlanet(event.target.value);
      return;
    }
    if (event.target.matches('[data-fleet-own-target]')) {
      const form = event.target.closest('[data-fleet-form]');
      if (event.target.value) handlers.fillFleetTarget(form, event.target.value);
      else handlers.previewFleet(form);
      return;
    }
    const form = event.target.closest('[data-fleet-form]');
    if (form) handlers.previewFleet(form);
  };
}
