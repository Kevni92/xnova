const RESOURCE_KEYS = Object.freeze(['metal', 'crystal', 'deuterium']);

export const RESEARCH_CATEGORIES = Object.freeze([
  { key: 'fundamentals', name: 'Grundlagenforschung', description: 'Energie-, Laser-, Ionen-, Hyperraum- und Plasmatechnologien.' },
  { key: 'drives', name: 'Antriebstechnik', description: 'Antriebe für zivile und militärische Schiffe.' },
  { key: 'operations', name: 'Raumfahrt & Koordination', description: 'Spionage, Flottenkontrolle, Kolonisierung und Forschungsnetzwerke.' },
  { key: 'combat', name: 'Kampfforschung', description: 'Waffen-, Schild- und Panzerungsverbesserungen.' },
]);

export const RESEARCH_DEFINITIONS = Object.freeze({
  energyTechnology: definition({
    name: 'Energietechnik', category: 'fundamentals', icon: 'E',
    description: 'Beherrschung und Speicherung immer größerer Energiemengen.',
    baseCost: { metal: 0, crystal: 800, deuterium: 400 }, costFactor: 2,
    labLevel: 1, technologies: {}, effect: (level) => `Energiesysteme Stufe ${level}`,
  }),
  laserTechnology: definition({
    name: 'Lasertechnik', category: 'fundamentals', icon: 'L',
    description: 'Gebündeltes Licht als Werkzeug und Waffengrundlage.',
    baseCost: { metal: 200, crystal: 100, deuterium: 0 }, costFactor: 2,
    labLevel: 1, technologies: { energyTechnology: 2 }, effect: (level) => `Lasertechnik Stufe ${level}`,
  }),
  ionTechnology: definition({
    name: 'Ionentechnik', category: 'fundamentals', icon: 'I',
    description: 'Beschleunigte Ionen ermöglichen fortschrittliche Waffen und Antriebe.',
    baseCost: { metal: 1000, crystal: 300, deuterium: 100 }, costFactor: 2,
    labLevel: 4, technologies: { energyTechnology: 4, laserTechnology: 5 }, effect: (level) => `${level * 4} % günstigere Abrisskosten (später)`,
  }),
  hyperspaceTechnology: definition({
    name: 'Hyperraumtechnik', category: 'fundamentals', icon: 'H',
    description: 'Grundlage für Hyperraumantriebe und interstellare Hochtechnologie.',
    baseCost: { metal: 0, crystal: 4000, deuterium: 2000 }, costFactor: 2,
    labLevel: 7, technologies: { energyTechnology: 5, shieldingTechnology: 5 }, effect: (level) => `${level * 5} % mehr Ladekapazität (später)`,
  }),
  plasmaTechnology: definition({
    name: 'Plasmatechnik', category: 'fundamentals', icon: 'P',
    description: 'Extrem heißes Plasma steigert Produktion und Waffentechnik.',
    baseCost: { metal: 2000, crystal: 4000, deuterium: 1000 }, costFactor: 2,
    labLevel: 4, technologies: { energyTechnology: 8, laserTechnology: 10, ionTechnology: 5 },
    effect: (level) => `+${level}% Metall, +${formatDecimal(level * 0.66)}% Kristall, +${formatDecimal(level * 0.33)}% Deuterium (später)`,
  }),
  combustionDrive: definition({
    name: 'Verbrennungstriebwerk', category: 'drives', icon: 'V',
    description: 'Bewährter chemischer Antrieb für leichte Schiffe.',
    baseCost: { metal: 400, crystal: 0, deuterium: 600 }, costFactor: 2,
    labLevel: 1, technologies: { energyTechnology: 1 }, effect: (level) => `+${level * 10} % Geschwindigkeit für Verbrennungsantriebe`,
  }),
  impulseDrive: definition({
    name: 'Impulstriebwerk', category: 'drives', icon: 'A',
    description: 'Reaktionsarme Beschleunigung für schnellere Raumfahrt.',
    baseCost: { metal: 2000, crystal: 4000, deuterium: 600 }, costFactor: 2,
    labLevel: 2, technologies: { energyTechnology: 1 }, effect: (level) => `+${level * 20} % Geschwindigkeit für Impulsantriebe`,
  }),
  hyperspaceDrive: definition({
    name: 'Hyperraumantrieb', category: 'drives', icon: 'X',
    description: 'Überlichtschneller Antrieb für große interstellare Schiffe.',
    baseCost: { metal: 10000, crystal: 20000, deuterium: 6000 }, costFactor: 2,
    labLevel: 7, technologies: { hyperspaceTechnology: 3 }, effect: (level) => `+${level * 30} % Geschwindigkeit für Hyperraumantriebe`,
  }),
  espionageTechnology: definition({
    name: 'Spionagetechnik', category: 'operations', icon: 'S',
    description: 'Verbessert Aufklärung und Schutz vor feindlicher Spionage.',
    baseCost: { metal: 200, crystal: 1000, deuterium: 200 }, costFactor: 2,
    labLevel: 3, technologies: {}, effect: (level) => `Spionagestufe ${level}`,
  }),
  computerTechnology: definition({
    name: 'Computertechnik', category: 'operations', icon: 'C',
    description: 'Erhöht die Zahl gleichzeitig kontrollierbarer Flotten.',
    baseCost: { metal: 0, crystal: 400, deuterium: 600 }, costFactor: 2,
    labLevel: 1, technologies: {}, effect: (level) => `${level + 1} Flottenslots`,
  }),
  astrophysics: definition({
    name: 'Astrophysik', category: 'operations', icon: '★',
    description: 'Ermöglicht Expeditionen und zusätzliche Kolonien.',
    baseCost: { metal: 4000, crystal: 8000, deuterium: 4000 }, costFactor: 1.75,
    labLevel: 3, technologies: { espionageTechnology: 4, impulseDrive: 3 }, effect: (level) => `${Math.floor((level + 1) / 2)} zusätzliche Kolonien (später)`,
  }),
  intergalacticResearchNetwork: definition({
    name: 'Intergalaktisches Forschungsnetzwerk', category: 'operations', icon: 'N',
    description: 'Verbindet Forschungslabore mehrerer Planeten und addiert ihre Stufen.',
    baseCost: { metal: 240000, crystal: 400000, deuterium: 160000 }, costFactor: 2,
    labLevel: 10, technologies: { computerTechnology: 8, hyperspaceTechnology: 8 }, effect: (level) => `${level} zusätzliche Labore können beitragen`,
  }),
  gravitonTechnology: definition({
    name: 'Gravitonforschung', category: 'operations', icon: 'G',
    description: 'Manipulation der Gravitation durch extrem hohe Energiemengen.',
    baseCost: { metal: 0, crystal: 0, deuterium: 0 }, energyCost: 300000, costFactor: 3,
    labLevel: 12, technologies: {}, maxLevel: 1, effect: (level) => level > 0 ? 'Gravitonforschung abgeschlossen' : 'Nicht erforscht',
  }),
  weaponsTechnology: definition({
    name: 'Waffentechnik', category: 'combat', icon: 'W',
    description: 'Steigert die Angriffskraft aller Waffen.',
    baseCost: { metal: 800, crystal: 200, deuterium: 0 }, costFactor: 2,
    labLevel: 4, technologies: {}, effect: (level) => `+${level * 10} % Waffenstärke`,
  }),
  shieldingTechnology: definition({
    name: 'Schildtechnik', category: 'combat', icon: 'D',
    description: 'Verstärkt die Schilde aller Schiffe und Verteidigungsanlagen.',
    baseCost: { metal: 200, crystal: 600, deuterium: 0 }, costFactor: 2,
    labLevel: 6, technologies: { energyTechnology: 3 }, effect: (level) => `+${level * 10} % Schildstärke`,
  }),
  armourTechnology: definition({
    name: 'Raumschiffpanzerung', category: 'combat', icon: 'R',
    description: 'Erhöht die strukturelle Integrität aller Einheiten.',
    baseCost: { metal: 1000, crystal: 0, deuterium: 0 }, costFactor: 2,
    labLevel: 2, technologies: {}, effect: (level) => `+${level * 10} % Strukturpunkte`,
  }),
});

export const RESEARCH_KEYS = Object.freeze(Object.keys(RESEARCH_DEFINITIONS));

export function createEmptyResearch() { return Object.fromEntries(RESEARCH_KEYS.map((key) => [key, 0])); }
export function getResearchDefinition(key) { const research = RESEARCH_DEFINITIONS[key]; if (!research) throw new Error(`Unbekannte Forschung: ${key}`); return research; }
export function calculateResearchCost(key, targetLevel) {
  const definition = getResearchDefinition(key);
  const multiplier = definition.costFactor ** Math.max(0, targetLevel - 1);
  return {
    ...Object.fromEntries(RESOURCE_KEYS.map((resource) => [resource, Math.floor((definition.baseCost[resource] ?? 0) * multiplier)])),
    energy: Math.floor((definition.energyCost ?? 0) * multiplier),
  };
}
export function calculateResearchDuration(key, targetLevel, effectiveLabLevel, researchSpeed = 1) {
  const costs = calculateResearchCost(key, targetLevel);
  const hours = (costs.metal + costs.crystal) / (1000 * Math.max(1, 1 + effectiveLabLevel) * Math.max(0.01, researchSpeed));
  return Math.max(1, Math.ceil(hours * 3600));
}
export function describeResearchEffect(key, level) { return getResearchDefinition(key).effect(Math.max(0, Number(level) || 0)); }

function definition(value) {
  return Object.freeze({
    ...value,
    maxLevel: value.maxLevel ?? null,
    energyCost: value.energyCost ?? 0,
    baseCost: Object.freeze({ ...value.baseCost }),
    technologies: Object.freeze({ ...value.technologies }),
  });
}
function formatDecimal(value) { return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 }).format(value); }
