import { calculateEconomy } from './building-config.js';
import { materializePlanet, normalizePlanet } from './planet-service.js';
import {
  RESEARCH_CATEGORIES,
  RESEARCH_DEFINITIONS,
  RESEARCH_KEYS,
  calculateResearchCost,
  calculateResearchDuration,
  createEmptyResearch,
  describeResearchEffect,
  getResearchDefinition,
} from './research-config.js';

const RESOURCE_KEYS = Object.freeze(['metal', 'crystal', 'deuterium']);

export class ResearchError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ResearchError';
    this.code = code;
  }
}

export function createResearchService({ store, now = () => Date.now(), idFactory = defaultId, researchSpeed = 1 } = {}) {
  if (!store) throw new Error('Ein Speicheradapter ist erforderlich.');
  const accountLocks = new Map();

  async function syncResearch({ ownerEmail }) {
    return withAccountLock(ownerEmail, async () => {
      const user = await requireUser(ownerEmail);
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(user);
      const changed = materializeResearch(account, timestamp);
      if (changed) await store.putUser(account);
      return presentQueue(account, timestamp);
    });
  }

  async function getResearchState({ ownerEmail, coordinates }) {
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(await requireUser(ownerEmail));
      materializeResearch(account, timestamp);
      const planet = await loadPlanet(ownerEmail, coordinates, timestamp);
      const colonies = await store.getUserColonies(ownerEmail);
      await Promise.all([store.putUser(account), store.putColony(planet)]);
      return presentResearchState(account, planet, colonies, timestamp, researchSpeed);
    });
  }

  async function startResearch({ ownerEmail, coordinates, researchKey }) {
    getResearchDefinition(researchKey);
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(await requireUser(ownerEmail));
      materializeResearch(account, timestamp);
      if (account.researchQueue) throw new ResearchError('RESEARCH_BUSY', 'Es läuft bereits ein Forschungsauftrag.');

      const planet = await loadPlanet(ownerEmail, coordinates, timestamp);
      const colonies = await store.getUserColonies(ownerEmail);
      const definition = getResearchDefinition(researchKey);
      const currentLevel = account.research[researchKey];
      const targetLevel = currentLevel + 1;
      if (definition.maxLevel && currentLevel >= definition.maxLevel) {
        throw new ResearchError('MAX_LEVEL', 'Diese Forschung ist bereits vollständig abgeschlossen.');
      }

      const requirements = requirementStatuses(definition, account.research, planet.buildings);
      if (requirements.some((requirement) => !requirement.complete)) {
        throw new ResearchError('REQUIREMENTS_MISSING', 'Die Voraussetzungen für diese Forschung sind noch nicht erfüllt.');
      }

      const costs = calculateResearchCost(researchKey, targetLevel);
      const economy = calculateEconomy(planet.buildings, planet.bonuses);
      if (!hasResources(planet.resources, costs) || economy.energy.available < costs.energy) {
        throw new ResearchError('NOT_ENOUGH_RESOURCES', 'Für diese Forschung fehlen Rohstoffe oder Energie.');
      }

      const network = calculateResearchNetwork({
        colonies,
        originCoordinates: coordinates,
        requiredLabLevel: definition.labLevel,
        networkLevel: account.research.intergalacticResearchNetwork,
      });
      const durationSeconds = calculateResearchDuration(researchKey, targetLevel, network.effectiveLabLevel, researchSpeed);
      spendResources(planet, costs);
      account.researchQueue = {
        id: idFactory(), researchKey, fromLevel: currentLevel, targetLevel, costs,
        originCoordinates: coordinates, effectiveLabLevel: network.effectiveLabLevel,
        contributingLabs: network.contributingLabs,
        durationSeconds,
        startedAt: new Date(timestamp).toISOString(),
        completesAt: new Date(timestamp + durationSeconds * 1000).toISOString(),
      };

      await Promise.all([store.putUser(account), store.putColony(planet)]);
      return presentResearchState(account, planet, coloniesWithPlanet(colonies, planet), timestamp, researchSpeed);
    });
  }

  async function cancelResearch({ ownerEmail }) {
    return withAccountLock(ownerEmail, async () => {
      const timestamp = normalizeNow(now());
      const account = normalizeResearchAccount(await requireUser(ownerEmail));
      materializeResearch(account, timestamp);
      const job = account.researchQueue;
      if (!job) throw new ResearchError('NO_RESEARCH', 'Es läuft aktuell keine Forschung.');

      const origin = await loadPlanet(ownerEmail, job.originCoordinates, timestamp);
      const storage = calculateEconomy(origin.buildings, origin.bonuses).storage;
      for (const resource of RESOURCE_KEYS) {
        origin.resources[resource] = Math.min(storage[resource], origin.resources[resource] + (job.costs[resource] ?? 0));
      }
      account.researchQueue = null;
      await Promise.all([store.putUser(account), store.putColony(origin)]);
      return { refunded: structuredClone(job.costs), researchKey: job.researchKey };
    });
  }

  async function requireUser(ownerEmail) {
    const user = await store.getUser(ownerEmail);
    if (!user) throw new ResearchError('USER_NOT_FOUND', 'Der Spieleraccount wurde nicht gefunden.');
    return user;
  }

  async function loadPlanet(ownerEmail, coordinates, timestamp) {
    if (!coordinates) throw new ResearchError('PLANET_REQUIRED', 'Für die Forschung muss ein Planet ausgewählt sein.');
    const stored = await store.getColony(coordinates);
    if (!stored || stored.ownerEmail !== ownerEmail) throw new ResearchError('PLANET_NOT_FOUND', 'Der ausgewählte Planet wurde nicht gefunden.');
    const planet = normalizePlanet(stored, timestamp);
    materializePlanet(planet, timestamp);
    return planet;
  }

  async function withAccountLock(ownerEmail, operation) {
    const previous = accountLocks.get(ownerEmail) ?? Promise.resolve();
    const current = previous.catch(() => {}).then(operation);
    accountLocks.set(ownerEmail, current);
    try { return await current; }
    finally { if (accountLocks.get(ownerEmail) === current) accountLocks.delete(ownerEmail); }
  }

  return { syncResearch, getResearchState, startResearch, cancelResearch };
}

export function normalizeResearchAccount(stored) {
  const account = structuredClone(stored);
  account.research = { ...createEmptyResearch(), ...(account.research ?? {}) };
  for (const key of RESEARCH_KEYS) account.research[key] = Math.max(0, Number(account.research[key]) || 0);
  account.researchQueue = account.researchQueue ? normalizeResearchJob(account.researchQueue) : null;
  return account;
}

export function materializeResearch(account, timestamp = Date.now()) {
  const job = account.researchQueue;
  if (!job || normalizeNow(job.completesAt) > normalizeNow(timestamp)) return false;
  account.research[job.researchKey] = Math.max(account.research[job.researchKey] ?? 0, job.targetLevel);
  account.researchQueue = null;
  return true;
}

export function calculateResearchNetwork({ colonies, originCoordinates, requiredLabLevel, networkLevel }) {
  const origin = colonies.find((colony) => colony.coordinates === originCoordinates);
  const originLevel = Math.max(0, Number(origin?.buildings?.researchLab) || 0);
  const additional = colonies
    .filter((colony) => colony.coordinates !== originCoordinates)
    .map((colony) => ({ coordinates: colony.coordinates, level: Math.max(0, Number(colony.buildings?.researchLab) || 0) }))
    .filter((entry) => entry.level >= requiredLabLevel)
    .sort((left, right) => right.level - left.level)
    .slice(0, Math.max(0, Number(networkLevel) || 0));
  return {
    effectiveLabLevel: originLevel + additional.reduce((sum, entry) => sum + entry.level, 0),
    contributingLabs: [{ coordinates: originCoordinates, level: originLevel }, ...additional],
  };
}

function presentResearchState(account, planet, colonies, timestamp, researchSpeed) {
  const economy = calculateEconomy(planet.buildings, planet.bonuses);
  const researches = RESEARCH_KEYS.map((key) => {
    const definition = RESEARCH_DEFINITIONS[key];
    const currentLevel = account.research[key];
    const nextLevel = currentLevel + 1;
    const maxed = Boolean(definition.maxLevel && currentLevel >= definition.maxLevel);
    const costs = calculateResearchCost(key, nextLevel);
    const requirements = requirementStatuses(definition, account.research, planet.buildings);
    const network = calculateResearchNetwork({
      colonies,
      originCoordinates: planet.coordinates,
      requiredLabLevel: definition.labLevel,
      networkLevel: account.research.intergalacticResearchNetwork,
    });
    const canAfford = hasResources(planet.resources, costs) && economy.energy.available >= costs.energy;
    const active = account.researchQueue?.researchKey === key;
    return {
      key, name: definition.name, category: definition.category, icon: definition.icon,
      description: definition.description, currentLevel, nextLevel, maxLevel: definition.maxLevel,
      currentEffect: describeResearchEffect(key, currentLevel), nextEffect: describeResearchEffect(key, nextLevel),
      costs, requirements, effectiveLabLevel: network.effectiveLabLevel,
      durationSeconds: calculateResearchDuration(key, nextLevel, network.effectiveLabLevel, researchSpeed),
      maxed, active, canAfford,
      canResearch: !maxed && !account.researchQueue && canAfford && requirements.every((entry) => entry.complete),
    };
  });

  return {
    coordinates: planet.coordinates,
    selectedLabLevel: planet.buildings.researchLab ?? 0,
    availableEnergy: economy.energy.available,
    researchLevels: structuredClone(account.research),
    categories: RESEARCH_CATEGORIES.map((category) => ({ ...category, researches: researches.filter((entry) => entry.category === category.key) })),
    queue: presentQueue(account, timestamp),
  };
}

function presentQueue(account, timestamp) {
  const job = account.researchQueue;
  if (!job) return null;
  const remainingSeconds = Math.max(0, Math.ceil((normalizeNow(job.completesAt) - timestamp) / 1000));
  const progress = job.durationSeconds <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((1 - remainingSeconds / job.durationSeconds) * 100)));
  return {
    ...structuredClone(job),
    researchName: RESEARCH_DEFINITIONS[job.researchKey].name,
    remainingSeconds,
    progress,
  };
}

function requirementStatuses(definition, research, buildings) {
  return [
    { type: 'building', key: 'researchLab', name: 'Forschungslabor', requiredLevel: definition.labLevel, currentLevel: Math.max(0, Number(buildings.researchLab) || 0) },
    ...Object.entries(definition.technologies).map(([key, requiredLevel]) => ({
      type: 'research', key, name: RESEARCH_DEFINITIONS[key].name, requiredLevel, currentLevel: research[key] ?? 0,
    })),
  ].map((entry) => ({ ...entry, complete: entry.currentLevel >= entry.requiredLevel }));
}

function coloniesWithPlanet(colonies, planet) {
  return colonies.map((entry) => entry.coordinates === planet.coordinates ? structuredClone(planet) : entry);
}
function hasResources(resources, costs) { return RESOURCE_KEYS.every((resource) => Number(resources[resource] ?? 0) >= Number(costs[resource] ?? 0)); }
function spendResources(planet, costs) { for (const resource of RESOURCE_KEYS) planet.resources[resource] -= costs[resource] ?? 0; }
function normalizeResearchJob(job) { return { ...structuredClone(job), durationSeconds: Math.max(1, Number(job.durationSeconds) || 1) }; }
function normalizeNow(value) { const parsed = typeof value === 'number' ? value : Date.parse(value); return Number.isFinite(parsed) ? parsed : Date.now(); }
function defaultId() { return globalThis.crypto?.randomUUID?.() ?? `research-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
