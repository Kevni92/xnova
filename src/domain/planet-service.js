import {
  BUILDING_DEFINITIONS,
  BUILDING_KEYS,
  CANCEL_REFUND_FACTOR,
  MAX_QUEUE_LENGTH,
  calculateBuildDuration,
  calculateDemolitionCost,
  calculateDemolitionDuration,
  calculateEconomy,
  calculateUpgradeCost,
  createEmptyBuildings,
  describeBuildingEffect,
  getBuildingDefinition,
} from './building-config.js';

const START_RESOURCES = Object.freeze({ metal: 500, crystal: 500, deuterium: 0 });
const RESOURCE_KEYS = Object.freeze(['metal', 'crystal', 'deuterium']);

export class PlanetError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PlanetError';
    this.code = code;
  }
}

export function createPlanetService({ store, now = () => Date.now(), idFactory = defaultId } = {}) {
  if (!store) throw new Error('Ein Speicheradapter ist erforderlich.');

  const planetLocks = new Map();

  async function ensureActivePlanet({ ownerEmail, fallbackCoordinates = null }) {
    const colonies = await store.getUserColonies(ownerEmail);
    if (colonies.length === 0) throw new PlanetError('NO_PLANET', 'Für diesen Spieler wurde kein Planet gefunden.');

    const selected = await store.getActivePlanet(ownerEmail);
    const valid = colonies.find((colony) => colony.coordinates === selected);
    const fallback = colonies.find((colony) => colony.coordinates === fallbackCoordinates);
    const active = valid ?? fallback ?? colonies[0];

    if (selected !== active.coordinates) await store.setActivePlanet(ownerEmail, active.coordinates);
    return active.coordinates;
  }

  async function getGameState({ ownerEmail }) {
    const coordinates = await ensureActivePlanet({ ownerEmail });
    const activePlanet = await mutatePlanet(coordinates, ownerEmail, (planet, timestamp) => {
      materializePlanet(planet, timestamp);
      return presentPlanet(planet, timestamp);
    });
    const colonies = await store.getUserColonies(ownerEmail);

    return {
      activePlanet,
      planets: colonies
        .map((colony) => ({
          coordinates: colony.coordinates,
          name: colony.name,
          planetType: colony.planetType,
          fields: colony.fields,
        }))
        .sort((left, right) => left.coordinates.localeCompare(right.coordinates)),
      buildings: presentBuildings(activePlanet),
    };
  }

  async function selectPlanet({ ownerEmail, coordinates }) {
    const planet = await store.getColony(coordinates);
    assertOwner(planet, ownerEmail);
    await store.setActivePlanet(ownerEmail, coordinates);
    return getGameState({ ownerEmail });
  }

  async function getBuildingDetails({ ownerEmail, coordinates, buildingKey }) {
    getBuildingDefinition(buildingKey);
    return mutatePlanet(coordinates, ownerEmail, (planet, timestamp) => {
      materializePlanet(planet, timestamp);
      const projected = projectBuildings(planet);
      const currentLevel = planet.buildings[buildingKey];
      const projectedLevel = projected[buildingKey];
      const roboticsLevel = projected.roboticsFactory;
      const definition = getBuildingDefinition(buildingKey);
      const levels = [];

      for (let level = currentLevel; level <= currentLevel + 10; level += 1) {
        levels.push({
          level,
          costs: level === 0 ? zeroCosts() : calculateUpgradeCost(buildingKey, level),
          durationSeconds: level === 0 ? 0 : calculateBuildDuration(buildingKey, level, roboticsLevel),
          effect: describeBuildingEffect(buildingKey, level, planet.bonuses, planet.buildings),
          current: level === currentLevel,
          queued: level > currentLevel && level <= projectedLevel,
        });
      }

      return {
        key: buildingKey,
        name: definition.name,
        description: definition.description,
        icon: definition.icon,
        currentLevel,
        projectedLevel,
        levels,
      };
    });
  }

  async function queueUpgrade({ ownerEmail, coordinates, buildingKey }) {
    getBuildingDefinition(buildingKey);
    return mutatePlanet(coordinates, ownerEmail, (planet, timestamp) => {
      materializePlanet(planet, timestamp);
      assertQueueSpace(planet);

      const projected = projectBuildings(planet);
      const targetLevel = projected[buildingKey] + 1;
      const projectedFields = usedFields(projected);
      if (projectedFields >= planet.fields) {
        throw new PlanetError('NO_FIELDS', 'Auf diesem Planeten sind keine freien Felder verfügbar.');
      }

      const costs = calculateUpgradeCost(buildingKey, targetLevel);
      spendResources(planet, costs);
      const durationSeconds = calculateBuildDuration(buildingKey, targetLevel, projected.roboticsFactory);
      const job = scheduleJob(planet, timestamp, {
        id: idFactory(),
        action: 'upgrade',
        buildingKey,
        fromLevel: targetLevel - 1,
        targetLevel,
        costs,
        durationSeconds,
      });
      planet.buildQueue.push(job);
      return presentPlanet(planet, timestamp);
    });
  }

  async function queueDemolition({ ownerEmail, coordinates, buildingKey }) {
    getBuildingDefinition(buildingKey);
    return mutatePlanet(coordinates, ownerEmail, (planet, timestamp) => {
      materializePlanet(planet, timestamp);
      assertQueueSpace(planet);

      const projected = projectBuildings(planet);
      const currentLevel = projected[buildingKey];
      if (currentLevel <= 0) throw new PlanetError('NOT_BUILT', 'Dieses Gebäude kann nicht weiter abgerissen werden.');

      const costs = calculateDemolitionCost(buildingKey, currentLevel);
      spendResources(planet, costs);
      const durationSeconds = calculateDemolitionDuration(buildingKey, currentLevel, projected.roboticsFactory);
      const job = scheduleJob(planet, timestamp, {
        id: idFactory(),
        action: 'demolish',
        buildingKey,
        fromLevel: currentLevel,
        targetLevel: currentLevel - 1,
        costs,
        durationSeconds,
      });
      planet.buildQueue.push(job);
      return presentPlanet(planet, timestamp);
    });
  }

  async function cancelBuildJob({ ownerEmail, coordinates, jobId }) {
    return mutatePlanet(coordinates, ownerEmail, (planet, timestamp) => {
      materializePlanet(planet, timestamp);
      const index = planet.buildQueue.findIndex((job) => job.id === jobId);
      if (index < 0) throw new PlanetError('JOB_NOT_FOUND', 'Der Bauauftrag wurde nicht gefunden.');

      const [cancelled] = planet.buildQueue.splice(index, 1);
      const economy = calculateEconomy(planet.buildings, planet.bonuses);
      for (const resource of RESOURCE_KEYS) {
        const refund = Math.floor((cancelled.costs[resource] ?? 0) * CANCEL_REFUND_FACTOR);
        planet.resources[resource] = Math.min(economy.storage[resource], planet.resources[resource] + refund);
      }
      rescheduleQueue(planet, timestamp, cancelled);
      return presentPlanet(planet, timestamp);
    });
  }

  async function mutatePlanet(coordinates, ownerEmail, operation) {
    if (!coordinates) throw new PlanetError('PLANET_REQUIRED', 'Ein Planet muss ausgewählt sein.');
    return withPlanetLock(coordinates, async () => {
      const stored = await store.getColony(coordinates);
      assertOwner(stored, ownerEmail);
      const timestamp = normalizeNow(now());
      const planet = normalizePlanet(stored, timestamp);
      const result = operation(planet, timestamp);
      await store.putColony(planet);
      return result;
    });
  }

  async function withPlanetLock(coordinates, operation) {
    const previous = planetLocks.get(coordinates) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    planetLocks.set(coordinates, current);
    try {
      return await current;
    } finally {
      if (planetLocks.get(coordinates) === current) planetLocks.delete(coordinates);
    }
  }

  return {
    ensureActivePlanet,
    getGameState,
    selectPlanet,
    getBuildingDetails,
    queueUpgrade,
    queueDemolition,
    cancelBuildJob,
  };
}

export function normalizePlanet(stored, timestamp = Date.now()) {
  const planet = structuredClone(stored);
  planet.fields = Number(planet.fields) || 180;
  planet.buildings = { ...createEmptyBuildings(), ...(planet.buildings ?? {}) };
  planet.buildQueue = Array.isArray(planet.buildQueue) ? planet.buildQueue.map(normalizeJob) : [];
  planet.resources = {
    ...START_RESOURCES,
    ...(planet.resources ?? {}),
    lastCalculatedAt: planet.resources?.lastCalculatedAt ?? planet.colonizedAt ?? new Date(timestamp).toISOString(),
  };
  return planet;
}

export function materializePlanet(planet, timestamp) {
  const target = normalizeNow(timestamp);
  let cursor = normalizeNow(planet.resources.lastCalculatedAt);
  if (cursor > target) cursor = target;
  planet.buildQueue.sort((left, right) => normalizeNow(left.completesAt) - normalizeNow(right.completesAt));

  const pending = [];
  for (const job of planet.buildQueue) {
    const completesAt = normalizeNow(job.completesAt);
    if (completesAt > target) {
      pending.push(job);
      continue;
    }
    accrueResources(planet, cursor, completesAt);
    planet.buildings[job.buildingKey] = Math.max(0, job.targetLevel);
    cursor = Math.max(cursor, completesAt);
  }

  planet.buildQueue = pending;
  accrueResources(planet, cursor, target);
  planet.resources.lastCalculatedAt = new Date(target).toISOString();
  return planet;
}

function accrueResources(planet, from, to) {
  if (to <= from) return;
  const hours = (to - from) / 3_600_000;
  const economy = calculateEconomy(planet.buildings, planet.bonuses);
  for (const resource of RESOURCE_KEYS) {
    const produced = economy.production[resource] * hours;
    planet.resources[resource] = roundResource(
      Math.min(economy.storage[resource], Number(planet.resources[resource] ?? 0) + produced),
    );
  }
}

function presentPlanet(planet, timestamp) {
  const economy = calculateEconomy(planet.buildings, planet.bonuses);
  return {
    coordinates: planet.coordinates,
    name: planet.name,
    planetType: planet.planetType,
    fields: planet.fields,
    usedFields: usedFields(planet.buildings),
    projectedUsedFields: usedFields(projectBuildings(planet)),
    temperature: structuredClone(planet.temperature),
    bonuses: structuredClone(planet.bonuses),
    resources: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, Math.floor(planet.resources[key])])),
    production: structuredClone(economy.production),
    storage: structuredClone(economy.storage),
    energy: structuredClone(economy.energy),
    buildings: structuredClone(planet.buildings),
    buildQueue: planet.buildQueue.map((job, index) => ({
      ...structuredClone(job),
      position: index + 1,
      buildingName: BUILDING_DEFINITIONS[job.buildingKey].name,
      remainingSeconds: Math.max(0, Math.ceil((normalizeNow(job.completesAt) - timestamp) / 1000)),
      active: index === 0,
    })),
  };
}

function presentBuildings(activePlanet) {
  const projected = projectBuildings(activePlanet);
  return BUILDING_KEYS.map((key) => {
    const definition = BUILDING_DEFINITIONS[key];
    const currentLevel = activePlanet.buildings[key];
    const projectedLevel = projected[key];
    const nextLevel = projectedLevel + 1;
    const upgradeCosts = calculateUpgradeCost(key, nextLevel);
    const demolitionCosts = projectedLevel > 0 ? calculateDemolitionCost(key, projectedLevel) : zeroCosts();
    return {
      key,
      name: definition.name,
      description: definition.description,
      icon: definition.icon,
      currentLevel,
      projectedLevel,
      nextLevel,
      currentEffect: describeBuildingEffect(key, currentLevel, activePlanet.bonuses, activePlanet.buildings),
      nextEffect: describeBuildingEffect(key, nextLevel, activePlanet.bonuses, projected),
      upgradeCosts,
      upgradeDurationSeconds: calculateBuildDuration(key, nextLevel, projected.roboticsFactory),
      demolitionCosts,
      demolitionDurationSeconds: projectedLevel > 0
        ? calculateDemolitionDuration(key, projectedLevel, projected.roboticsFactory)
        : 0,
      canAffordUpgrade: hasResources(activePlanet.resources, upgradeCosts),
      canAffordDemolition: projectedLevel > 0 && hasResources(activePlanet.resources, demolitionCosts),
      canUpgrade: activePlanet.buildQueue.length < MAX_QUEUE_LENGTH
        && usedFields(projected) < activePlanet.fields
        && hasResources(activePlanet.resources, upgradeCosts),
      canDemolish: activePlanet.buildQueue.length < MAX_QUEUE_LENGTH
        && projectedLevel > 0
        && hasResources(activePlanet.resources, demolitionCosts),
    };
  });
}

function scheduleJob(planet, timestamp, job) {
  const lastJob = planet.buildQueue.at(-1);
  const startsAt = lastJob ? Math.max(timestamp, normalizeNow(lastJob.completesAt)) : timestamp;
  const completesAt = startsAt + job.durationSeconds * 1000;
  return {
    ...job,
    createdAt: new Date(timestamp).toISOString(),
    startsAt: new Date(startsAt).toISOString(),
    completesAt: new Date(completesAt).toISOString(),
  };
}

function rescheduleQueue(planet, timestamp, cancelled) {
  const active = planet.buildQueue[0];
  let cursor = timestamp;
  let startIndex = 0;

  if (active && active.id !== cancelled.id && normalizeNow(active.startsAt) <= timestamp && normalizeNow(active.completesAt) > timestamp) {
    cursor = normalizeNow(active.completesAt);
    startIndex = 1;
  }

  for (let index = startIndex; index < planet.buildQueue.length; index += 1) {
    const job = planet.buildQueue[index];
    job.startsAt = new Date(cursor).toISOString();
    cursor += job.durationSeconds * 1000;
    job.completesAt = new Date(cursor).toISOString();
  }
}

function projectBuildings(planet) {
  const projected = { ...planet.buildings };
  for (const job of planet.buildQueue) projected[job.buildingKey] = job.targetLevel;
  return projected;
}

function assertOwner(planet, ownerEmail) {
  if (!planet || planet.ownerEmail !== ownerEmail) {
    throw new PlanetError('PLANET_NOT_FOUND', 'Der ausgewählte Planet wurde nicht gefunden.');
  }
}

function assertQueueSpace(planet) {
  if (planet.buildQueue.length >= MAX_QUEUE_LENGTH) {
    throw new PlanetError('QUEUE_FULL', `Die Bauwarteschlange ist auf ${MAX_QUEUE_LENGTH} Aufträge begrenzt.`);
  }
}

function spendResources(planet, costs) {
  if (!hasResources(planet.resources, costs)) {
    throw new PlanetError('INSUFFICIENT_RESOURCES', 'Für diesen Auftrag sind nicht genügend Ressourcen verfügbar.');
  }
  for (const resource of RESOURCE_KEYS) {
    planet.resources[resource] = roundResource(planet.resources[resource] - (costs[resource] ?? 0));
  }
}

function hasResources(resources, costs) {
  return RESOURCE_KEYS.every((resource) => Number(resources[resource] ?? 0) >= Number(costs[resource] ?? 0));
}

function usedFields(buildings) {
  return BUILDING_KEYS.reduce((sum, key) => sum + Math.max(0, Number(buildings[key]) || 0), 0);
}

function normalizeJob(job) {
  return {
    ...job,
    costs: { ...zeroCosts(), ...(job.costs ?? {}) },
    durationSeconds: Math.max(1, Number(job.durationSeconds) || 1),
    fromLevel: Math.max(0, Number(job.fromLevel) || 0),
    targetLevel: Math.max(0, Number(job.targetLevel) || 0),
  };
}

function normalizeNow(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function zeroCosts() {
  return { metal: 0, crystal: 0, deuterium: 0 };
}

function roundResource(value) {
  return Math.max(0, Math.round(value * 1000) / 1000);
}

function defaultId() {
  return globalThis.crypto?.randomUUID?.() ?? `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
