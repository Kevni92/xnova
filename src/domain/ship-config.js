const RESOURCE_KEYS = Object.freeze(['metal', 'crystal', 'deuterium']);

export const SHIP_DEFINITIONS = Object.freeze({
  smallCargo: definition({
    name: 'Kleiner Transporter', icon: 'KT', role: 'Transport',
    description: 'Schneller Frachter für kleine Rohstofflieferungen zwischen Planeten.',
    cost: { metal: 2000, crystal: 2000, deuterium: 0 },
    cargoCapacity: 5000, baseSpeed: 5000, fuelConsumption: 10,
    attack: 5, shield: 10, hull: 4000,
    drive: 'combustionDrive', driveBonus: 0.1,
    requirements: { shipyard: 2, technologies: { combustionDrive: 2 } },
  }),
  largeCargo: definition({
    name: 'Großer Transporter', icon: 'GT', role: 'Transport',
    description: 'Geräumiger Frachter für große Rohstoffmengen und langfristige Versorgungslinien.',
    cost: { metal: 6000, crystal: 6000, deuterium: 0 },
    cargoCapacity: 25000, baseSpeed: 7500, fuelConsumption: 50,
    attack: 5, shield: 25, hull: 12000,
    drive: 'combustionDrive', driveBonus: 0.1,
    requirements: { shipyard: 4, technologies: { combustionDrive: 6 } },
  }),
  lightFighter: definition({
    name: 'Leichter Jäger', icon: 'LJ', role: 'Kampfschiff',
    description: 'Wendiges Standardschiff, das bereits für Verlegungen und kleine Fracht genutzt werden kann.',
    cost: { metal: 3000, crystal: 1000, deuterium: 0 },
    cargoCapacity: 50, baseSpeed: 12500, fuelConsumption: 20,
    attack: 50, shield: 10, hull: 4000,
    drive: 'combustionDrive', driveBonus: 0.1,
    requirements: { shipyard: 1, technologies: { combustionDrive: 1 } },
  }),
  heavyFighter: definition({
    name: 'Schwerer Jäger', icon: 'SJ', role: 'Kampfschiff',
    description: 'Robustes Mehrzweckschiff mit Impulsantrieb und kleiner Ladekapazität.',
    cost: { metal: 6000, crystal: 4000, deuterium: 0 },
    cargoCapacity: 100, baseSpeed: 10000, fuelConsumption: 75,
    attack: 150, shield: 25, hull: 10000,
    drive: 'impulseDrive', driveBonus: 0.2,
    requirements: { shipyard: 3, technologies: { armourTechnology: 2, impulseDrive: 2 } },
  }),
});

export const SHIP_KEYS = Object.freeze(Object.keys(SHIP_DEFINITIONS));
export const MAX_SHIPYARD_QUEUE_LENGTH = 5;
export const SHIPYARD_CANCEL_REFUND_FACTOR = 0.75;

export function createEmptyShips() {
  return Object.fromEntries(SHIP_KEYS.map((key) => [key, 0]));
}

export function getShipDefinition(key) {
  const definitionValue = SHIP_DEFINITIONS[key];
  if (!definitionValue) throw new Error(`Unbekanntes Schiff: ${key}`);
  return definitionValue;
}

export function calculateShipCost(key, quantity = 1) {
  const definitionValue = getShipDefinition(key);
  const normalizedQuantity = normalizeQuantity(quantity);
  return Object.fromEntries(RESOURCE_KEYS.map((resource) => [resource, definitionValue.cost[resource] * normalizedQuantity]));
}

export function calculateShipUnitDuration(key, shipyardLevel = 0) {
  const costs = calculateShipCost(key, 1);
  const structuralCost = costs.metal + costs.crystal;
  const productionLevel = Math.max(1, 1 + Math.max(0, Number(shipyardLevel) || 0));
  return Math.max(1, Math.ceil(structuralCost / (100 * productionLevel)));
}

export function calculateEffectiveShipSpeed(key, research = {}) {
  const definitionValue = getShipDefinition(key);
  const driveLevel = Math.max(0, Number(research[definitionValue.drive]) || 0);
  return Math.floor(definitionValue.baseSpeed * (1 + driveLevel * definitionValue.driveBonus));
}

export function requirementStatuses(key, research = {}, buildings = {}) {
  const definitionValue = getShipDefinition(key);
  return [
    {
      type: 'building', key: 'shipyard', name: 'Raumschiffwerft',
      requiredLevel: definitionValue.requirements.shipyard,
      currentLevel: Math.max(0, Number(buildings.shipyard) || 0),
    },
    ...Object.entries(definitionValue.requirements.technologies).map(([technologyKey, requiredLevel]) => ({
      type: 'research', key: technologyKey, name: technologyName(technologyKey), requiredLevel,
      currentLevel: Math.max(0, Number(research[technologyKey]) || 0),
    })),
  ].map((entry) => ({ ...entry, complete: entry.currentLevel >= entry.requiredLevel }));
}

export function calculateFleetShipStats(ships, research = {}) {
  let cargoCapacity = 0;
  let baseConsumption = 0;
  let slowestSpeed = Infinity;
  let totalShips = 0;
  for (const key of SHIP_KEYS) {
    const quantity = Math.max(0, Math.floor(Number(ships[key]) || 0));
    if (!quantity) continue;
    const definitionValue = getShipDefinition(key);
    totalShips += quantity;
    cargoCapacity += definitionValue.cargoCapacity * quantity;
    baseConsumption += definitionValue.fuelConsumption * quantity;
    slowestSpeed = Math.min(slowestSpeed, calculateEffectiveShipSpeed(key, research));
  }
  return {
    totalShips,
    cargoCapacity,
    baseConsumption,
    slowestSpeed: Number.isFinite(slowestSpeed) ? slowestSpeed : 0,
  };
}

function definition(value) {
  return Object.freeze({
    ...value,
    cost: Object.freeze({ ...value.cost }),
    requirements: Object.freeze({
      shipyard: value.requirements.shipyard,
      technologies: Object.freeze({ ...value.requirements.technologies }),
    }),
  });
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Die Stückzahl muss eine positive ganze Zahl sein.');
  return quantity;
}

function technologyName(key) {
  const names = {
    combustionDrive: 'Verbrennungstriebwerk',
    impulseDrive: 'Impulstriebwerk',
    armourTechnology: 'Raumschiffpanzerung',
  };
  return names[key] ?? key;
}
