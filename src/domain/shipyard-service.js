import { calculateEconomy } from './building-config.js';
import { materializePlanet, normalizePlanet } from './planet-service.js';
import { materializeResearch, normalizeResearchAccount } from './research-service.js';
import {
  MAX_SHIPYARD_QUEUE_LENGTH,
  SHIPYARD_CANCEL_REFUND_FACTOR,
  SHIP_DEFINITIONS,
  SHIP_KEYS,
  calculateEffectiveShipSpeed,
  calculateShipCost,
  calculateShipUnitDuration,
  createEmptyShips,
  getShipDefinition,
  requirementStatuses,
} from './ship-config.js';

const RESOURCE_KEYS = Object.freeze(['metal', 'crystal', 'deuterium']);

export class ShipyardError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ShipyardError';
    this.code = code;
  }
}

export function createShipyardService({ store, now = () => Date.now(), idFactory = defaultId } = {}) {
  if (!store) throw new Error('Ein Speicheradapter ist erforderlich.');
  const planetLocks = new Map();

  async function syncAll({ ownerEmail }) {
    const timestamp = normalizeNow(now());
    const account = normalizeResearchAccount(await requireUser(ownerEmail));
    const researchChanged = materializeResearch(account, timestamp);
    const colonies = await store.getUserColonies(ownerEmail);
    await Promise.all(colonies.map((stored) => withPlanetLock(stored.coordinates, async () => {
      const planet = normalizeShipyardPlanet(normalizePlanet(await store.getColony(stored.coordinates), timestamp));
      materializePlanet(planet, timestamp);
      materializeShipyard(planet, timestamp);
      await store.putColony(planet);
    })));
    if (researchChanged) await store.putUser(account);
    return true;
  }

  async function getShipyardState({ ownerEmail, coordinates }) {
    return withPlanetLock(coordinates, async () => {
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(await requireUser(ownerEmail));
      const researchChanged = materializeResearch(account, timestamp);
      const planet = await loadPlanet(ownerEmail, coordinates, timestamp);
      await store.putColony(planet);
      if (researchChanged) await store.putUser(account);
      return presentShipyardState(planet, account.research, timestamp);
    });
  }

  async function buildShips({ ownerEmail, coordinates, shipKey, quantity }) {
    getShipDefinition(shipKey);
    const normalizedQuantity = normalizeQuantity(quantity);
    return withPlanetLock(coordinates, async () => {
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(await requireUser(ownerEmail));
      materializeResearch(account, timestamp);
      const planet = await loadPlanet(ownerEmail, coordinates, timestamp);
      if (planet.shipyardQueue.length >= MAX_SHIPYARD_QUEUE_LENGTH) {
        throw new ShipyardError('QUEUE_FULL', 'Die Werftwarteschlange ist bereits voll.');
      }
      const requirements = requirementStatuses(shipKey, account.research, planet.buildings);
      if (requirements.some((entry) => !entry.complete)) {
        throw new ShipyardError('REQUIREMENTS_MISSING', 'Die Voraussetzungen für dieses Schiff sind noch nicht erfüllt.');
      }
      const costs = calculateShipCost(shipKey, normalizedQuantity);
      if (!hasResources(planet.resources, costs)) {
        throw new ShipyardError('NOT_ENOUGH_RESOURCES', 'Für diesen Werftauftrag fehlen Rohstoffe.');
      }
      spendResources(planet, costs);
      const unitDurationSeconds = calculateShipUnitDuration(shipKey, planet.buildings.shipyard);
      const previous = planet.shipyardQueue.at(-1);
      const startsAt = previous ? Math.max(timestamp, normalizeNow(previous.completesAt)) : timestamp;
      const completesAt = startsAt + unitDurationSeconds * normalizedQuantity * 1000;
      planet.shipyardQueue.push({
        id: idFactory(), shipKey, quantity: normalizedQuantity, produced: 0, costs,
        unitDurationSeconds,
        createdAt: new Date(timestamp).toISOString(),
        startsAt: new Date(startsAt).toISOString(),
        completesAt: new Date(completesAt).toISOString(),
      });
      await Promise.all([store.putUser(account), store.putColony(planet)]);
      return presentShipyardState(planet, account.research, timestamp);
    });
  }

  async function cancelShipyardJob({ ownerEmail, coordinates, jobId }) {
    return withPlanetLock(coordinates, async () => {
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(await requireUser(ownerEmail));
      materializeResearch(account, timestamp);
      const planet = await loadPlanet(ownerEmail, coordinates, timestamp);
      const index = planet.shipyardQueue.findIndex((job) => job.id === jobId);
      if (index < 0) throw new ShipyardError('JOB_NOT_FOUND', 'Der Werftauftrag wurde nicht gefunden.');
      const [job] = planet.shipyardQueue.splice(index, 1);
      const remaining = Math.max(0, job.quantity - job.produced);
      const unitCosts = calculateShipCost(job.shipKey, 1);
      const storage = calculateEconomy(planet.buildings, planet.bonuses).storage;
      for (const resource of RESOURCE_KEYS) {
        const refund = Math.floor(unitCosts[resource] * remaining * SHIPYARD_CANCEL_REFUND_FACTOR);
        planet.resources[resource] = Math.min(storage[resource], planet.resources[resource] + refund);
      }
      rescheduleQueue(planet, timestamp);
      await Promise.all([store.putUser(account), store.putColony(planet)]);
      return presentShipyardState(planet, account.research, timestamp);
    });
  }

  async function loadPlanet(ownerEmail, coordinates, timestamp) {
    if (!coordinates) throw new ShipyardError('PLANET_REQUIRED', 'Für die Werft muss ein Planet ausgewählt sein.');
    const stored = await store.getColony(coordinates);
    if (!stored || stored.ownerEmail !== ownerEmail) throw new ShipyardError('PLANET_NOT_FOUND', 'Der ausgewählte Planet wurde nicht gefunden.');
    const planet = normalizeShipyardPlanet(normalizePlanet(stored, timestamp));
    materializePlanet(planet, timestamp);
    materializeShipyard(planet, timestamp);
    return planet;
  }

  async function requireUser(ownerEmail) {
    const user = await store.getUser(ownerEmail);
    if (!user) throw new ShipyardError('USER_NOT_FOUND', 'Der Spieleraccount wurde nicht gefunden.');
    return user;
  }

  async function withPlanetLock(coordinates, operation) {
    const previous = planetLocks.get(coordinates) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    planetLocks.set(coordinates, current);
    try { return await current; }
    finally { if (planetLocks.get(coordinates) === current) planetLocks.delete(coordinates); }
  }

  return { syncAll, getShipyardState, buildShips, cancelShipyardJob };
}

export function normalizeShipyardPlanet(stored) {
  const planet = structuredClone(stored);
  planet.ships = { ...createEmptyShips(), ...(planet.ships ?? {}) };
  for (const key of SHIP_KEYS) planet.ships[key] = Math.max(0, Math.floor(Number(planet.ships[key]) || 0));
  planet.shipyardQueue = Array.isArray(planet.shipyardQueue) ? planet.shipyardQueue.map(normalizeJob) : [];
  return planet;
}

export function materializeShipyard(planet, timestamp = Date.now()) {
  const target = normalizeNow(timestamp);
  let changed = false;
  const pending = [];
  planet.shipyardQueue.sort((left, right) => normalizeNow(left.startsAt) - normalizeNow(right.startsAt));
  for (const job of planet.shipyardQueue) {
    const startsAt = normalizeNow(job.startsAt);
    const producible = target <= startsAt
      ? 0
      : Math.min(job.quantity, Math.floor((target - startsAt) / (job.unitDurationSeconds * 1000)));
    if (producible > job.produced) {
      planet.ships[job.shipKey] += producible - job.produced;
      job.produced = producible;
      changed = true;
    }
    if (job.produced < job.quantity) pending.push(job);
    else changed = true;
  }
  planet.shipyardQueue = pending;
  return changed;
}

function presentShipyardState(planet, research, timestamp) {
  const queue = planet.shipyardQueue.map((job, index) => presentJob(job, timestamp, index));
  const ships = SHIP_KEYS.map((key) => {
    const definition = SHIP_DEFINITIONS[key];
    const requirements = requirementStatuses(key, research, planet.buildings);
    const costs = calculateShipCost(key, 1);
    return {
      key, name: definition.name, icon: definition.icon, role: definition.role,
      description: definition.description, owned: planet.ships[key], costs,
      cargoCapacity: definition.cargoCapacity,
      speed: calculateEffectiveShipSpeed(key, research),
      fuelConsumption: definition.fuelConsumption,
      attack: definition.attack, shield: definition.shield, hull: definition.hull,
      unitDurationSeconds: calculateShipUnitDuration(key, planet.buildings.shipyard),
      requirements,
      canAfford: hasResources(planet.resources, costs),
      canBuild: planet.shipyardQueue.length < MAX_SHIPYARD_QUEUE_LENGTH
        && requirements.every((entry) => entry.complete)
        && hasResources(planet.resources, costs),
    };
  });
  return {
    coordinates: planet.coordinates,
    shipyardLevel: planet.buildings.shipyard ?? 0,
    queueSlots: { used: queue.length, maximum: MAX_SHIPYARD_QUEUE_LENGTH },
    totalShips: SHIP_KEYS.reduce((sum, key) => sum + planet.ships[key], 0),
    ships,
    queue,
  };
}

function presentJob(job, timestamp, index) {
  const remaining = Math.max(0, job.quantity - job.produced);
  const remainingSeconds = Math.max(0, Math.ceil((normalizeNow(job.completesAt) - timestamp) / 1000));
  return {
    ...structuredClone(job),
    shipName: SHIP_DEFINITIONS[job.shipKey].name,
    remaining,
    remainingSeconds,
    progress: job.quantity <= 0 ? 100 : Math.round((job.produced / job.quantity) * 100),
    active: index === 0,
  };
}

function rescheduleQueue(planet, timestamp) {
  let cursor = timestamp;
  for (const job of planet.shipyardQueue) {
    const remaining = Math.max(0, job.quantity - job.produced);
    job.startsAt = new Date(cursor).toISOString();
    cursor += remaining * job.unitDurationSeconds * 1000;
    job.completesAt = new Date(cursor).toISOString();
  }
}

function normalizeJob(job) {
  return {
    ...structuredClone(job),
    quantity: Math.max(1, Math.floor(Number(job.quantity) || 1)),
    produced: Math.max(0, Math.floor(Number(job.produced) || 0)),
    unitDurationSeconds: Math.max(1, Math.ceil(Number(job.unitDurationSeconds) || 1)),
  };
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999) {
    throw new ShipyardError('INVALID_QUANTITY', 'Die Stückzahl muss zwischen 1 und 9.999 liegen.');
  }
  return quantity;
}

function hasResources(resources, costs) {
  return RESOURCE_KEYS.every((key) => Number(resources[key] ?? 0) >= Number(costs[key] ?? 0));
}
function spendResources(planet, costs) { for (const key of RESOURCE_KEYS) planet.resources[key] -= costs[key] ?? 0; }
function normalizeNow(value) { const parsed = typeof value === 'number' ? value : Date.parse(value); return Number.isFinite(parsed) ? parsed : Date.now(); }
function defaultId() { return globalThis.crypto?.randomUUID?.() ?? `shipyard-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
