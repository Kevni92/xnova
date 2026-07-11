const DEFAULT_UNIVERSE_SEED = 'xnova-alpha-1';

export const STAR_SYSTEM_RULES = Object.freeze({
  galaxies: 5,
  systemsPerGalaxy: 200,
  positionsPerSystem: 15,
  maxCombinedBonus: 30,
  homeworldFields: 180,
});

const POSITION_PROFILES = Object.freeze([
  { from: 1, to: 3, fields: [80, 150], temperature: [70, 140], solarBonus: 15, deuteriumBonus: -20 },
  { from: 4, to: 6, fields: [120, 190], temperature: [25, 80], solarBonus: 8, deuteriumBonus: -10 },
  { from: 7, to: 9, fields: [160, 250], temperature: [-20, 40], solarBonus: 0, deuteriumBonus: 0 },
  { from: 10, to: 12, fields: [130, 210], temperature: [-70, -10], solarBonus: -8, deuteriumBonus: 15 },
  { from: 13, to: 15, fields: [90, 170], temperature: [-130, -60], solarBonus: -15, deuteriumBonus: 30 },
]);

const STAR_CLASSES = Object.freeze([
  { key: 'yellow', label: 'Gelber Stern', weight: 50, temperatureShift: 0, solarBonus: 0, variance: 1 },
  { key: 'red', label: 'Roter Zwerg', weight: 25, temperatureShift: -15, solarBonus: -5, variance: 1 },
  { key: 'blue', label: 'Blauer Stern', weight: 15, temperatureShift: 20, solarBonus: 10, variance: 1 },
  { key: 'white', label: 'Weißer Stern', weight: 10, temperatureShift: 0, solarBonus: 5, variance: 1.2 },
]);

const RESOURCE_LABELS = Object.freeze({ metal: 'Metall', crystal: 'Kristall', deuterium: 'Deuterium' });

export class UniverseError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'UniverseError';
    this.code = code;
  }
}

export function createStarSystemService({
  store,
  universeSeed = DEFAULT_UNIVERSE_SEED,
  now = () => new Date().toISOString(),
} = {}) {
  if (!store) throw new Error('Ein Speicheradapter ist erforderlich.');

  async function getSystem({ galaxy, system, viewerEmail = null }) {
    const coordinates = validateSystemCoordinates(galaxy, system);
    const systemKey = createSystemKey(coordinates.galaxy, coordinates.system);
    const colonies = await store.getColoniesInSystem(systemKey);
    const coloniesByPosition = new Map(colonies.map((colony) => [colony.position, colony]));
    const star = generateStar(universeSeed, coordinates.galaxy, coordinates.system);

    return {
      galaxy: coordinates.galaxy,
      system: coordinates.system,
      star: publicStar(star),
      positions: Array.from({ length: STAR_SYSTEM_RULES.positionsPerSystem }, (_, index) => {
        const position = index + 1;
        const colony = coloniesByPosition.get(position);
        return colony
          ? { position, occupied: true, colony: publicColony(colony, viewerEmail) }
          : { position, occupied: false };
      }),
    };
  }

  async function colonize({ ownerEmail, ownerName, galaxy, system, position, name }) {
    return createColony({ ownerEmail, ownerName, galaxy, system, position, name });
  }

  async function createColony({
    ownerEmail,
    ownerName,
    galaxy,
    system,
    position,
    name,
    fieldsOverride = null,
    isHomeworld = false,
  }) {
    validateOwner(ownerEmail, ownerName);
    const coordinates = validateCoordinates(galaxy, system, position);
    const coordinateKey = createCoordinateKey(coordinates.galaxy, coordinates.system, coordinates.position);
    if (await store.getColony(coordinateKey)) throw positionOccupied();

    const star = generateStar(universeSeed, coordinates.galaxy, coordinates.system);
    const generated = generatePlanet(universeSeed, coordinates, star);
    if (fieldsOverride != null) generated.fields = Number(fieldsOverride);
    const colony = {
      coordinates: coordinateKey,
      systemKey: createSystemKey(coordinates.galaxy, coordinates.system),
      galaxy: coordinates.galaxy,
      system: coordinates.system,
      position: coordinates.position,
      ownerEmail,
      ownerName,
      name: normalizePlanetName(name, coordinates),
      colonizedAt: now(),
      isHomeworld,
      ...generated,
    };

    try {
      await store.addColony(colony);
    } catch (error) {
      if (error?.name === 'ConstraintError') throw positionOccupied();
      throw error;
    }
    return publicColony(colony, ownerEmail);
  }

  async function ensureHomeworld({ ownerEmail, ownerName }) {
    validateOwner(ownerEmail, ownerName);
    const colonies = await store.getUserColonies(ownerEmail);
    const existing = colonies.find((colony) => colony.isHomeworld) ?? colonies[0];
    if (existing) {
      if (existing.fields !== STAR_SYSTEM_RULES.homeworldFields || !existing.isHomeworld) {
        existing.fields = STAR_SYSTEM_RULES.homeworldFields;
        existing.isHomeworld = true;
        await store.putColony?.(existing);
      }
      return publicColony(existing, ownerEmail);
    }

    const coordinates = await findFreeHomeworld(ownerEmail);
    return createColony({
      ownerEmail,
      ownerName,
      ...coordinates,
      name: 'Nova Prime',
      fieldsOverride: STAR_SYSTEM_RULES.homeworldFields,
      isHomeworld: true,
    });
  }

  async function findFreeHomeworld(ownerEmail) {
    const total = STAR_SYSTEM_RULES.galaxies * STAR_SYSTEM_RULES.systemsPerGalaxy * STAR_SYSTEM_RULES.positionsPerSystem;
    const start = hashString(`${universeSeed}:homeworld:${ownerEmail}`) % total;
    for (let offset = 0; offset < total; offset += 1) {
      const index = (start + offset) % total;
      const position = (index % STAR_SYSTEM_RULES.positionsPerSystem) + 1;
      const systemIndex = Math.floor(index / STAR_SYSTEM_RULES.positionsPerSystem);
      const system = (systemIndex % STAR_SYSTEM_RULES.systemsPerGalaxy) + 1;
      const galaxy = Math.floor(systemIndex / STAR_SYSTEM_RULES.systemsPerGalaxy) + 1;
      if (!(await store.getColony(createCoordinateKey(galaxy, system, position)))) return { galaxy, system, position };
    }
    throw new UniverseError('UNIVERSE_FULL', 'Im Universum ist keine freie Position mehr verfügbar.');
  }

  return { getSystem, colonize, ensureHomeworld };
}

function validateOwner(ownerEmail, ownerName) {
  if (!ownerEmail || !ownerName) throw new UniverseError('INVALID_OWNER', 'Für die Kolonisierung wird ein Spielerprofil benötigt.');
}

function validateSystemCoordinates(galaxy, system) {
  const normalizedGalaxy = normalizeInteger(galaxy, 'Galaxie');
  const normalizedSystem = normalizeInteger(system, 'System');
  if (normalizedGalaxy < 1 || normalizedGalaxy > STAR_SYSTEM_RULES.galaxies) {
    throw new UniverseError('INVALID_GALAXY', `Die Galaxie muss zwischen 1 und ${STAR_SYSTEM_RULES.galaxies} liegen.`);
  }
  if (normalizedSystem < 1 || normalizedSystem > STAR_SYSTEM_RULES.systemsPerGalaxy) {
    throw new UniverseError('INVALID_SYSTEM', `Das System muss zwischen 1 und ${STAR_SYSTEM_RULES.systemsPerGalaxy} liegen.`);
  }
  return { galaxy: normalizedGalaxy, system: normalizedSystem };
}

function validateCoordinates(galaxy, system, position) {
  const coordinates = validateSystemCoordinates(galaxy, system);
  const normalizedPosition = normalizeInteger(position, 'Position');
  if (normalizedPosition < 1 || normalizedPosition > STAR_SYSTEM_RULES.positionsPerSystem) {
    throw new UniverseError('INVALID_POSITION', `Die Position muss zwischen 1 und ${STAR_SYSTEM_RULES.positionsPerSystem} liegen.`);
  }
  return { ...coordinates, position: normalizedPosition };
}

function normalizeInteger(value, label) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new UniverseError('INVALID_COORDINATES', `${label} muss eine ganze Zahl sein.`);
  return parsed;
}

function normalizePlanetName(name, coordinates) {
  const normalized = String(name ?? '').trim();
  if (!normalized) return `Kolonie ${coordinates.galaxy}:${coordinates.system}:${coordinates.position}`;
  if (normalized.length < 3 || normalized.length > 30) {
    throw new UniverseError('INVALID_PLANET_NAME', 'Der Planetenname muss 3 bis 30 Zeichen lang sein.');
  }
  return normalized;
}

function generateStar(seed, galaxy, system) {
  const random = createRandom(`${seed}:star:${galaxy}:${system}`);
  const roll = Math.floor(random() * 100);
  let threshold = 0;
  for (const star of STAR_CLASSES) {
    threshold += star.weight;
    if (roll < threshold) return star;
  }
  return STAR_CLASSES[0];
}

function generatePlanet(seed, coordinates, star) {
  const random = createRandom(`${seed}:planet:${coordinates.galaxy}:${coordinates.system}:${coordinates.position}`);
  const profile = POSITION_PROFILES.find(({ from, to }) => coordinates.position >= from && coordinates.position <= to);
  const baseFields = randomInteger(random, profile.fields[0], profile.fields[1]);
  const fields = clamp(baseFields + (star.key === 'white' ? randomInteger(random, -8, 8) : 0), profile.fields[0], profile.fields[1]);
  const averageTemperature = randomInteger(random, profile.temperature[0], profile.temperature[1]) + star.temperatureShift;
  const temperatureSpread = Math.round(randomInteger(random, 28, 42) * star.variance);
  const diameter = clamp(Math.round(4_000 + fields * 42 + randomInteger(random, -550, 550) * star.variance), 5_000, 16_000);
  return {
    planetType: determinePlanetType(averageTemperature, random),
    fields,
    diameter,
    temperature: {
      min: averageTemperature - Math.round(temperatureSpread / 2),
      max: averageTemperature + Math.round(temperatureSpread / 2),
    },
    bonuses: {
      solarEnergy: clamp(profile.solarBonus + star.solarBonus, -STAR_SYSTEM_RULES.maxCombinedBonus, STAR_SYSTEM_RULES.maxCombinedBonus),
      deuterium: profile.deuteriumBonus,
      resource: generateResourceBonus(random),
    },
  };
}

function determinePlanetType(averageTemperature, random) {
  if (averageTemperature > 90) return 'Vulkanwelt';
  if (averageTemperature > 45) return 'Wüstenwelt';
  if (averageTemperature > 5) return random() < 0.45 ? 'Ozeanwelt' : 'Terranische Welt';
  if (averageTemperature > -45) return 'Tundrawelt';
  return 'Eiswelt';
}

function generateResourceBonus(random) {
  const roll = Math.floor(random() * 100);
  if (roll < 70) return null;
  const resourceKeys = Object.keys(RESOURCE_LABELS);
  const resource = resourceKeys[randomInteger(random, 0, resourceKeys.length - 1)];
  const percent = roll < 90 ? randomInteger(random, 3, 5) : roll < 99 ? randomInteger(random, 6, 8) : 10;
  return { resource, label: RESOURCE_LABELS[resource], percent };
}

function publicStar(star) {
  return { key: star.key, label: star.label, temperatureShift: star.temperatureShift, solarEnergyBonus: star.solarBonus };
}

function publicColony(colony, viewerEmail) {
  return {
    coordinates: colony.coordinates,
    galaxy: colony.galaxy,
    system: colony.system,
    position: colony.position,
    name: colony.name,
    ownerName: colony.ownerName,
    ownedByViewer: Boolean(viewerEmail && colony.ownerEmail === viewerEmail),
    colonizedAt: colony.colonizedAt,
    planetType: colony.planetType,
    fields: colony.fields,
    diameter: colony.diameter,
    temperature: structuredClone(colony.temperature),
    bonuses: structuredClone(colony.bonuses),
  };
}

function createCoordinateKey(galaxy, system, position) { return `${galaxy}:${system}:${position}`; }
function createSystemKey(galaxy, system) { return `${galaxy}:${system}`; }
function positionOccupied() { return new UniverseError('POSITION_OCCUPIED', 'Diese Position ist bereits kolonisiert.'); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function randomInteger(random, min, max) { return Math.floor(random() * (max - min + 1)) + min; }

function createRandom(seed) {
  let state = hashString(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function hashString(value) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
