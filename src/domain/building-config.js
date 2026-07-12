const COST_KEYS = ['metal', 'crystal', 'deuterium'];

export const BUILDING_DEFINITIONS = Object.freeze({
  metalMine: definition({
    name: 'Metallmine', shortName: 'Metall',
    description: 'Fördert Metall, den wichtigsten Grundstoff für Gebäude und Schiffe.', icon: 'M',
    baseCost: { metal: 60, crystal: 15, deuterium: 0 }, costFactor: 1.5, baseDuration: 20, effect: 'metalProduction',
  }),
  crystalMine: definition({
    name: 'Kristallmine', shortName: 'Kristall',
    description: 'Gewinnt Kristall für Elektronik, Sensoren und komplexe Legierungen.', icon: 'K',
    baseCost: { metal: 48, crystal: 24, deuterium: 0 }, costFactor: 1.6, baseDuration: 24, effect: 'crystalProduction',
  }),
  deuteriumSynthesizer: definition({
    name: 'Deuteriumsynthetisierer', shortName: 'Deuterium',
    description: 'Extrahiert Deuterium als Treibstoff und hochwertigen Energieträger.', icon: 'D',
    baseCost: { metal: 225, crystal: 75, deuterium: 0 }, costFactor: 1.5, baseDuration: 32, effect: 'deuteriumProduction',
  }),
  solarPlant: definition({
    name: 'Solarkraftwerk', shortName: 'Energie',
    description: 'Versorgt Minen und planetare Anlagen mit elektrischer Energie.', icon: 'S',
    baseCost: { metal: 75, crystal: 30, deuterium: 0 }, costFactor: 1.5, baseDuration: 18, effect: 'energyProduction',
  }),
  metalStorage: definition({
    name: 'Metalllager', shortName: 'Metalllager', description: 'Erhöht die maximale Lagerkapazität für Metall.', icon: 'ML',
    baseCost: { metal: 1000, crystal: 0, deuterium: 0 }, costFactor: 2, baseDuration: 35, effect: 'metalStorage',
  }),
  crystalStorage: definition({
    name: 'Kristalllager', shortName: 'Kristalllager', description: 'Schützt und lagert größere Mengen Kristall.', icon: 'KL',
    baseCost: { metal: 1000, crystal: 500, deuterium: 0 }, costFactor: 2, baseDuration: 40, effect: 'crystalStorage',
  }),
  deuteriumTank: definition({
    name: 'Deuteriumtank', shortName: 'Deuteriumtank', description: 'Erweitert die sichere Lagerkapazität für Deuterium.', icon: 'DT',
    baseCost: { metal: 1000, crystal: 1000, deuterium: 0 }, costFactor: 2, baseDuration: 45, effect: 'deuteriumStorage',
  }),
  roboticsFactory: definition({
    name: 'Robotikzentrum', shortName: 'Robotik', description: 'Automatisiert Bauarbeiten und verkürzt zukünftige Bauzeiten.', icon: 'R',
    baseCost: { metal: 400, crystal: 120, deuterium: 200 }, costFactor: 2, baseDuration: 50, effect: 'buildSpeed',
  }),
  researchLab: definition({
    name: 'Forschungslabor', shortName: 'Labor',
    description: 'Ermöglicht neue Technologien und verkürzt die Forschungszeit auf diesem Planeten.', icon: 'F',
    baseCost: { metal: 200, crystal: 400, deuterium: 200 }, costFactor: 2, baseDuration: 60, effect: 'researchSpeed',
  }),
});

export const BUILDING_KEYS = Object.freeze(Object.keys(BUILDING_DEFINITIONS));
export const MAX_QUEUE_LENGTH = 5;
export const CANCEL_REFUND_FACTOR = 0.75;
export const DEMOLITION_COST_FACTOR = 0.1;
export const DEMOLITION_DURATION_FACTOR = 0.5;

export function createEmptyBuildings() { return Object.fromEntries(BUILDING_KEYS.map((key) => [key, 0])); }
export function getBuildingDefinition(key) { const building = BUILDING_DEFINITIONS[key]; if (!building) throw new Error(`Unbekanntes Gebäude: ${key}`); return building; }
export function calculateUpgradeCost(key, targetLevel) { const building = getBuildingDefinition(key); return mapCosts(building.baseCost, (amount) => Math.ceil(amount * building.costFactor ** Math.max(0, targetLevel - 1))); }
export function calculateBuildDuration(key, targetLevel, roboticsLevel = 0) { const building = getBuildingDefinition(key); const raw = building.baseDuration * 1.35 ** Math.max(0, targetLevel - 1); return Math.max(1, Math.ceil(raw / (1 + Math.max(0, roboticsLevel) * 0.5))); }
export function calculateDemolitionCost(key, currentLevel) { return mapCosts(calculateUpgradeCost(key, currentLevel), (amount) => Math.ceil(amount * DEMOLITION_COST_FACTOR)); }
export function calculateDemolitionDuration(key, currentLevel, roboticsLevel = 0) { return Math.max(1, Math.ceil(calculateBuildDuration(key, currentLevel, roboticsLevel) * DEMOLITION_DURATION_FACTOR)); }

export function calculateEconomy(buildings, bonuses = {}) {
  const metalLevel = level(buildings.metalMine); const crystalLevel = level(buildings.crystalMine);
  const deuteriumLevel = level(buildings.deuteriumSynthesizer); const solarLevel = level(buildings.solarPlant);
  const energyProduction = Math.floor(25 * solarLevel * 1.15 ** solarLevel * (1 + percent(bonuses.solarEnergy)));
  const energyConsumption = Math.floor(8 * metalLevel * 1.1 ** metalLevel + 10 * crystalLevel * 1.1 ** crystalLevel + 15 * deuteriumLevel * 1.1 ** deuteriumLevel);
  const energyFactor = energyConsumption === 0 ? 1 : Math.min(1, energyProduction / energyConsumption);
  const resourceBonus = bonuses.resource ?? null;
  const bonusFor = (resource) => resourceBonus?.resource === resource ? percent(resourceBonus.percent) : 0;
  const deuteriumPlanetBonus = percent(bonuses.deuterium);
  const production = {
    metal: 30 + Math.floor(30 * metalLevel * 1.12 ** metalLevel * energyFactor * (1 + bonusFor('metal'))),
    crystal: 15 + Math.floor(20 * crystalLevel * 1.1 ** crystalLevel * energyFactor * (1 + bonusFor('crystal'))),
    deuterium: Math.floor(10 * deuteriumLevel * 1.08 ** deuteriumLevel * energyFactor * (1 + bonusFor('deuterium')) * (1 + deuteriumPlanetBonus)),
  };
  const storage = { metal: storageCapacity(buildings.metalStorage), crystal: storageCapacity(buildings.crystalStorage), deuterium: storageCapacity(buildings.deuteriumTank) };
  return { production, storage, energy: { production: energyProduction, consumption: energyConsumption, available: energyProduction - energyConsumption, factor: energyFactor } };
}

export function describeBuildingEffect(key, targetLevel, bonuses = {}, baseBuildings = {}) {
  const buildings = { ...createEmptyBuildings(), ...baseBuildings, [key]: targetLevel };
  const economy = calculateEconomy(buildings, bonuses); const effect = getBuildingDefinition(key).effect;
  if (effect === 'metalProduction') return `${economy.production.metal}/h Metall inkl. Grundproduktion`;
  if (effect === 'crystalProduction') return `${economy.production.crystal}/h Kristall inkl. Grundproduktion`;
  if (effect === 'deuteriumProduction') return `${economy.production.deuterium}/h Deuterium`;
  if (effect === 'energyProduction') return `${economy.energy.production} Energie`;
  if (effect === 'metalStorage') return `${formatNumber(economy.storage.metal)} Metall Kapazität`;
  if (effect === 'crystalStorage') return `${formatNumber(economy.storage.crystal)} Kristall Kapazität`;
  if (effect === 'deuteriumStorage') return `${formatNumber(economy.storage.deuterium)} Deuterium Kapazität`;
  if (effect === 'researchSpeed') return `Laborstufe ${targetLevel} für schnellere Forschung`;
  return `${Math.round((1 - 1 / (1 + targetLevel * 0.5)) * 100)} % kürzere Bauzeit`;
}
function definition(value) { return Object.freeze({ ...value, baseCost: Object.freeze({ ...value.baseCost }) }); }
function mapCosts(costs, mapper) { return Object.fromEntries(COST_KEYS.map((key) => [key, mapper(costs[key] ?? 0, key)])); }
function storageCapacity(storageLevel) { return Math.floor(10_000 * 1.6 ** level(storageLevel)); }
function level(value) { return Math.max(0, Number(value) || 0); }
function percent(value) { return (Number(value) || 0) / 100; }
function formatNumber(value) { return new Intl.NumberFormat('de-DE').format(value); }
