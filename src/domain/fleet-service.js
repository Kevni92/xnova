import { materializePlanet, normalizePlanet } from './planet-service.js';
import { materializeResearch, normalizeResearchAccount } from './research-service.js';
import {
  SHIP_DEFINITIONS,
  SHIP_KEYS,
  calculateEffectiveShipSpeed,
  calculateFleetShipStats,
  createEmptyShips,
} from './ship-config.js';
import { materializeShipyard, normalizeShipyardPlanet } from './shipyard-service.js';

const RESOURCE_KEYS = Object.freeze(['metal', 'crystal', 'deuterium']);
const MISSION_NAMES = Object.freeze({ transport: 'Transport', station: 'Stationierung' });
const MAX_REPORTS = 20;

export class FleetError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FleetError';
    this.code = code;
  }
}

export function createFleetService({ store, now = () => Date.now(), idFactory = defaultId } = {}) {
  if (!store) throw new Error('Ein Speicheradapter ist erforderlich.');
  const accountLocks = new Map();

  async function syncFleets({ ownerEmail }) {
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = await loadAccount(ownerEmail, timestamp);
      await materializeFleets(account, timestamp);
      await store.putUser(account);
      return account.fleets.length;
    });
  }

  async function getFleetState({ ownerEmail, coordinates }) {
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = await loadAccount(ownerEmail, timestamp);
      await materializeFleets(account, timestamp);
      const origin = await loadPlanet(coordinates, timestamp);
      assertOwner(origin, ownerEmail);
      await Promise.all([store.putUser(account), store.putColony(origin)]);
      const colonies = await store.getUserColonies(ownerEmail);
      return presentFleetState(account, origin, colonies, timestamp);
    });
  }

  async function launchFleet({ ownerEmail, coordinates, targetCoordinates, mission, speedPercent, ships, cargo }) {
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = await loadAccount(ownerEmail, timestamp);
      await materializeFleets(account, timestamp);
      const origin = await loadPlanet(coordinates, timestamp);
      assertOwner(origin, ownerEmail);
      const targetKey = normalizeCoordinates(targetCoordinates);
      if (targetKey === origin.coordinates) throw new FleetError('SAME_PLANET', 'Start- und Zielplanet müssen verschieden sein.');
      const target = await loadPlanet(targetKey, timestamp, { required: true });
      const normalizedMission = normalizeMission(mission);
      if (normalizedMission === 'station' && target.ownerEmail !== ownerEmail) {
        throw new FleetError('FOREIGN_STATION', 'Schiffe können nur auf eigenen Planeten stationiert werden.');
      }
      const slots = Math.max(1, (account.research.computerTechnology ?? 0) + 1);
      if (account.fleets.length >= slots) throw new FleetError('NO_FLEET_SLOT', 'Alle verfügbaren Flottenslots sind belegt.');

      const selectedShips = normalizeShipSelection(ships);
      for (const key of SHIP_KEYS) {
        if (selectedShips[key] > origin.ships[key]) throw new FleetError('SHIPS_NOT_AVAILABLE', 'Die ausgewählten Schiffe sind nicht vollständig verfügbar.');
      }
      const stats = calculateFleetShipStats(selectedShips, account.research);
      if (stats.totalShips < 1) throw new FleetError('NO_SHIPS', 'Wähle mindestens ein Schiff aus.');
      const normalizedCargo = normalizeCargo(cargo);
      const cargoAmount = RESOURCE_KEYS.reduce((sum, key) => sum + normalizedCargo[key], 0);
      if (cargoAmount > stats.cargoCapacity) throw new FleetError('CARGO_TOO_LARGE', 'Die ausgewählte Fracht übersteigt die Ladekapazität.');
      const normalizedSpeed = normalizeSpeed(speedPercent);
      const distance = calculateDistance(origin.coordinates, target.coordinates);
      const durationSeconds = calculateFlightDuration(distance, stats.slowestSpeed, normalizedSpeed);
      const fuel = calculateFuelConsumption(distance, stats.baseConsumption, normalizedSpeed);
      for (const resource of RESOURCE_KEYS) {
        const required = normalizedCargo[resource] + (resource === 'deuterium' ? fuel : 0);
        if (origin.resources[resource] < required) throw new FleetError('NOT_ENOUGH_RESOURCES', 'Für Fracht und Treibstoff fehlen Rohstoffe.');
      }

      for (const key of SHIP_KEYS) origin.ships[key] -= selectedShips[key];
      for (const resource of RESOURCE_KEYS) origin.resources[resource] -= normalizedCargo[resource];
      origin.resources.deuterium -= fuel;
      const arrivalAt = timestamp + durationSeconds * 1000;
      account.fleets.push({
        id: idFactory(), mission: normalizedMission, phase: 'outbound',
        originCoordinates: origin.coordinates, originName: origin.name,
        targetCoordinates: target.coordinates, targetName: target.name,
        targetOwnerName: target.ownerName,
        ships: selectedShips, cargo: normalizedCargo,
        speedPercent: normalizedSpeed, distance, durationSeconds, fuel,
        launchedAt: new Date(timestamp).toISOString(),
        arrivalAt: new Date(arrivalAt).toISOString(),
        returnAt: normalizedMission === 'transport' ? new Date(arrivalAt + durationSeconds * 1000).toISOString() : null,
      });
      addReport(account, timestamp, 'departure', `${MISSION_NAMES[normalizedMission]} nach ${target.name} [${target.coordinates}] gestartet.`);
      await Promise.all([store.putUser(account), store.putColony(origin), store.putColony(target)]);
      const colonies = await store.getUserColonies(ownerEmail);
      return presentFleetState(account, origin, colonies, timestamp);
    });
  }

  async function recallFleet({ ownerEmail, fleetId }) {
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = await loadAccount(ownerEmail, timestamp);
      await materializeFleets(account, timestamp);
      const fleet = account.fleets.find((entry) => entry.id === fleetId);
      if (!fleet) throw new FleetError('FLEET_NOT_FOUND', 'Die Flotte wurde nicht gefunden.');
      if (fleet.phase !== 'outbound') throw new FleetError('FLEET_CANNOT_RECALL', 'Diese Flotte kann nicht mehr zurückgerufen werden.');
      const elapsed = Math.max(1, timestamp - normalizeNow(fleet.launchedAt));
      fleet.phase = 'returning';
      fleet.recalledAt = new Date(timestamp).toISOString();
      fleet.returnAt = new Date(timestamp + elapsed).toISOString();
      addReport(account, timestamp, 'recall', `Flotte nach ${fleet.targetName} [${fleet.targetCoordinates}] wurde zurückgerufen.`);
      await store.putUser(account);
      return { fleetId, returnAt: fleet.returnAt };
    });
  }

  async function loadAccount(ownerEmail, timestamp) {
    const stored = await store.getUser(ownerEmail);
    if (!stored) throw new FleetError('USER_NOT_FOUND', 'Der Spieleraccount wurde nicht gefunden.');
    const account = normalizeResearchAccount(stored);
    materializeResearch(account, timestamp);
    account.fleets = Array.isArray(account.fleets) ? account.fleets.map(normalizeFleet) : [];
    account.fleetReports = Array.isArray(account.fleetReports) ? account.fleetReports.map((entry) => structuredClone(entry)) : [];
    return account;
  }

  async function materializeFleets(account, timestamp) {
    const pending = [];
    for (const fleet of account.fleets.sort((left, right) => eventTime(left) - eventTime(right))) {
      if (fleet.phase === 'outbound' && normalizeNow(fleet.arrivalAt) <= timestamp) {
        const target = await loadPlanet(fleet.targetCoordinates, timestamp, { required: false });
        if (!target) {
          fleet.phase = 'returning';
          fleet.returnAt = new Date(timestamp + fleet.durationSeconds * 1000).toISOString();
          addReport(account, timestamp, 'target-missing', `Das Ziel [${fleet.targetCoordinates}] existiert nicht mehr. Die Flotte kehrt zurück.`);
        } else if (fleet.mission === 'station' && target.ownerEmail !== account.email) {
          fleet.phase = 'returning';
          fleet.returnAt = new Date(timestamp + fleet.durationSeconds * 1000).toISOString();
          addReport(account, timestamp, 'station-failed', `Stationierung auf [${fleet.targetCoordinates}] nicht möglich. Die Flotte kehrt zurück.`);
          await store.putColony(target);
        } else {
          deliverCargo(target, fleet.cargo);
          fleet.cargo = emptyCargo();
          if (fleet.mission === 'station') {
            addShips(target, fleet.ships);
            addReport(account, timestamp, 'stationed', `Flotte wurde auf ${target.name} [${target.coordinates}] stationiert.`);
            await store.putColony(target);
            continue;
          }
          fleet.phase = 'returning';
          addReport(account, timestamp, 'delivered', `Fracht wurde auf ${target.name} [${target.coordinates}] abgeliefert.`);
          await store.putColony(target);
        }
      }

      if (fleet.phase === 'returning' && normalizeNow(fleet.returnAt) <= timestamp) {
        const origin = await loadPlanet(fleet.originCoordinates, timestamp, { required: false });
        if (origin && origin.ownerEmail === account.email) {
          addShips(origin, fleet.ships);
          deliverCargo(origin, fleet.cargo);
          addReport(account, timestamp, 'returned', `Flotte ist auf ${origin.name} [${origin.coordinates}] zurückgekehrt.`);
          await store.putColony(origin);
        } else {
          addReport(account, timestamp, 'lost-origin', `Die Flotte konnte nicht zu ihrem Startplaneten [${fleet.originCoordinates}] zurückkehren.`);
        }
        continue;
      }
      pending.push(fleet);
    }
    account.fleets = pending;
  }

  async function loadPlanet(coordinates, timestamp, { required = true } = {}) {
    const key = normalizeCoordinates(coordinates);
    const stored = await store.getColony(key);
    if (!stored) {
      if (required) throw new FleetError('TARGET_NOT_FOUND', 'Am gewählten Ziel befindet sich kein Planet.');
      return null;
    }
    const planet = normalizeShipyardPlanet(normalizePlanet(stored, timestamp));
    materializePlanet(planet, timestamp);
    materializeShipyard(planet, timestamp);
    return planet;
  }

  async function withAccountLock(ownerEmail, operation) {
    const previous = accountLocks.get(ownerEmail) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    accountLocks.set(ownerEmail, current);
    try { return await current; }
    finally { if (accountLocks.get(ownerEmail) === current) accountLocks.delete(ownerEmail); }
  }

  return { syncFleets, getFleetState, launchFleet, recallFleet };
}

export function calculateDistance(originCoordinates, targetCoordinates) {
  const origin = parseCoordinates(originCoordinates);
  const target = parseCoordinates(targetCoordinates);
  if (origin.galaxy !== target.galaxy) return 20000 * Math.abs(origin.galaxy - target.galaxy);
  if (origin.system !== target.system) return 2700 + 95 * Math.abs(origin.system - target.system);
  return 1000 + 5 * Math.abs(origin.position - target.position);
}

export function calculateFlightDuration(distance, slowestSpeed, speedPercent) {
  if (slowestSpeed <= 0) throw new FleetError('NO_SPEED', 'Die Flotte besitzt keine gültige Geschwindigkeit.');
  return Math.max(1, Math.ceil(10 + (35000 / normalizeSpeed(speedPercent)) * Math.sqrt((distance * 10) / slowestSpeed)));
}

export function calculateFuelConsumption(distance, baseConsumption, speedPercent) {
  const speedFactor = normalizeSpeed(speedPercent) / 100 + 1;
  return Math.max(1, Math.ceil(baseConsumption * (distance / 35000) * speedFactor ** 2));
}

function presentFleetState(account, origin, colonies, timestamp) {
  const slots = Math.max(1, (account.research.computerTechnology ?? 0) + 1);
  return {
    coordinates: origin.coordinates,
    originName: origin.name,
    slots: { used: account.fleets.length, maximum: slots },
    resources: Object.fromEntries(RESOURCE_KEYS.map((key) => [key, Math.floor(origin.resources[key])])),
    ships: SHIP_KEYS.map((key) => ({
      key,
      name: SHIP_DEFINITIONS[key].name,
      icon: SHIP_DEFINITIONS[key].icon,
      available: origin.ships[key],
      cargoCapacity: SHIP_DEFINITIONS[key].cargoCapacity,
      speed: calculateEffectiveShipSpeed(key, account.research),
      fuelConsumption: SHIP_DEFINITIONS[key].fuelConsumption,
    })),
    ownPlanets: colonies.map((planet) => ({ coordinates: planet.coordinates, name: planet.name })),
    activeFleets: account.fleets.map((fleet) => presentFleet(fleet, timestamp)),
    reports: account.fleetReports.slice(0, MAX_REPORTS),
  };
}

function presentFleet(fleet, timestamp) {
  const dueAt = fleet.phase === 'outbound' ? fleet.arrivalAt : fleet.returnAt;
  return {
    ...structuredClone(fleet),
    missionName: MISSION_NAMES[fleet.mission],
    phaseName: fleet.phase === 'outbound' ? 'Hinflug' : 'Rückflug',
    remainingSeconds: Math.max(0, Math.ceil((normalizeNow(dueAt) - timestamp) / 1000)),
    canRecall: fleet.phase === 'outbound',
    shipSummary: SHIP_KEYS.filter((key) => fleet.ships[key] > 0).map((key) => ({ key, name: SHIP_DEFINITIONS[key].name, quantity: fleet.ships[key] })),
  };
}

function normalizeFleet(fleet) {
  return {
    ...structuredClone(fleet),
    mission: normalizeMission(fleet.mission),
    phase: fleet.phase === 'returning' ? 'returning' : 'outbound',
    ships: { ...createEmptyShips(), ...(fleet.ships ?? {}) },
    cargo: { ...emptyCargo(), ...(fleet.cargo ?? {}) },
    durationSeconds: Math.max(1, Math.ceil(Number(fleet.durationSeconds) || 1)),
  };
}

function normalizeShipSelection(value = {}) {
  return Object.fromEntries(SHIP_KEYS.map((key) => {
    const quantity = Number(value[key] ?? 0);
    if (!Number.isInteger(quantity) || quantity < 0) throw new FleetError('INVALID_SHIPS', 'Schiffsmengen müssen nichtnegative ganze Zahlen sein.');
    return [key, quantity];
  }));
}

function normalizeCargo(value = {}) {
  return Object.fromEntries(RESOURCE_KEYS.map((key) => {
    const amount = Number(value[key] ?? 0);
    if (!Number.isInteger(amount) || amount < 0) throw new FleetError('INVALID_CARGO', 'Frachtmengen müssen nichtnegative ganze Zahlen sein.');
    return [key, amount];
  }));
}

function normalizeMission(value) {
  if (value !== 'transport' && value !== 'station') throw new FleetError('INVALID_MISSION', 'Wähle Transport oder Stationierung als Mission.');
  return value;
}

function normalizeSpeed(value) {
  const speed = Number(value);
  if (!Number.isInteger(speed) || speed < 10 || speed > 100 || speed % 10 !== 0) {
    throw new FleetError('INVALID_SPEED', 'Die Flottengeschwindigkeit muss zwischen 10 und 100 Prozent liegen.');
  }
  return speed;
}

function normalizeCoordinates(value) {
  if (typeof value === 'string') {
    const coordinates = parseCoordinates(value);
    return `${coordinates.galaxy}:${coordinates.system}:${coordinates.position}`;
  }
  if (value && typeof value === 'object') return `${parseCoordinatePart(value.galaxy, 'Galaxie')}:${parseCoordinatePart(value.system, 'System')}:${parseCoordinatePart(value.position, 'Position')}`;
  throw new FleetError('INVALID_COORDINATES', 'Die Zielkoordinaten sind ungültig.');
}

function parseCoordinates(value) {
  const parts = String(value ?? '').replaceAll('[', '').replaceAll(']', '').split(':');
  if (parts.length !== 3) throw new FleetError('INVALID_COORDINATES', 'Koordinaten müssen im Format Galaxie:System:Position angegeben werden.');
  return {
    galaxy: parseCoordinatePart(parts[0], 'Galaxie'),
    system: parseCoordinatePart(parts[1], 'System'),
    position: parseCoordinatePart(parts[2], 'Position'),
  };
}

function parseCoordinatePart(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new FleetError('INVALID_COORDINATES', `${label} muss eine positive ganze Zahl sein.`);
  return parsed;
}

function assertOwner(planet, ownerEmail) {
  if (!planet || planet.ownerEmail !== ownerEmail) throw new FleetError('PLANET_NOT_FOUND', 'Der ausgewählte Startplanet wurde nicht gefunden.');
}
function deliverCargo(planet, cargo) { for (const key of RESOURCE_KEYS) planet.resources[key] += cargo[key] ?? 0; }
function addShips(planet, ships) { for (const key of SHIP_KEYS) planet.ships[key] += ships[key] ?? 0; }
function emptyCargo() { return { metal: 0, crystal: 0, deuterium: 0 }; }
function eventTime(fleet) { return normalizeNow(fleet.phase === 'outbound' ? fleet.arrivalAt : fleet.returnAt); }
function addReport(account, timestamp, type, text) {
  account.fleetReports.unshift({ id: defaultId(), type, text, createdAt: new Date(timestamp).toISOString() });
  account.fleetReports = account.fleetReports.slice(0, MAX_REPORTS);
}
function normalizeNow(value) { const parsed = typeof value === 'number' ? value : Date.parse(value); return Number.isFinite(parsed) ? parsed : Date.now(); }
function defaultId() { return globalThis.crypto?.randomUUID?.() ?? `fleet-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
