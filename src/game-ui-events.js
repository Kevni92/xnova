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
    if (action === 'colonize') await handlers.colonize(Number(target.dataset.position));
  };

  root.onchange = async (event) => {
    if (event.target.matches('[data-action="select-planet"]')) {
      await handlers.selectPlanet(event.target.value);
    }
  };
}
