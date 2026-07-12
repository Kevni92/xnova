import { describe, expect, it } from 'vitest';
import { calculateResearchCost, calculateResearchDuration } from '../src/domain/research-config.js';
import { calculateResearchNetwork, createResearchService } from '../src/domain/research-service.js';

class MemoryStore {
  users = new Map();
  colonies = new Map();
  async getUser(email) { return clone(this.users.get(email) ?? null); }
  async putUser(user) { this.users.set(user.email, clone(user)); }
  async getColony(coordinates) { return clone(this.colonies.get(coordinates) ?? null); }
  async putColony(colony) { this.colonies.set(colony.coordinates, clone(colony)); }
  async getUserColonies(ownerEmail) { return [...this.colonies.values()].filter((entry) => entry.ownerEmail === ownerEmail).map(clone); }
}

function setup({ research = {}, labLevel = 3, resources = {} } = {}) {
  const store = new MemoryStore();
  let timestamp = Date.parse('2026-07-12T12:00:00.000Z');
  const ownerEmail = 'researcher@example.com';
  const coordinates = '1:20:8';
  store.users.set(ownerEmail, { email: ownerEmail, username: 'Researcher', passwordHash: 'x', salt: 'y', research });
  store.colonies.set(coordinates, colony({ coordinates, ownerEmail, labLevel, timestamp, resources }));
  let counter = 0;
  const service = createResearchService({
    store,
    now: () => timestamp,
    idFactory: () => `research-${++counter}`,
    researchSpeed: 1000,
  });
  return {
    store, service, ownerEmail, coordinates,
    advance(seconds) { timestamp += seconds * 1000; },
    addColony(nextCoordinates, nextLabLevel) {
      store.colonies.set(nextCoordinates, colony({ coordinates: nextCoordinates, ownerEmail, labLevel: nextLabLevel, timestamp }));
    },
  };
}

describe('Forschungssystem', () => {
  it('liefert alle 16 klassischen Forschungen mit Voraussetzungen', async () => {
    const context = setup();
    const state = await context.service.getResearchState({ ownerEmail: context.ownerEmail, coordinates: context.coordinates });
    const researches = state.categories.flatMap((category) => category.researches);
    expect(researches).toHaveLength(16);
    const laser = researches.find((entry) => entry.key === 'laserTechnology');
    expect(laser.canResearch).toBe(false);
    expect(laser.requirements.find((entry) => entry.key === 'energyTechnology').complete).toBe(false);
  });

  it('zieht Kosten ab, begrenzt die Warteschlange auf einen Auftrag und schließt Forschung zeitbasiert ab', async () => {
    const context = setup({ resources: { metal: 10_000, crystal: 10_000, deuterium: 10_000 } });
    const started = await context.service.startResearch({
      ownerEmail: context.ownerEmail,
      coordinates: context.coordinates,
      researchKey: 'energyTechnology',
    });
    expect(started.queue.researchKey).toBe('energyTechnology');
    expect(context.store.colonies.get(context.coordinates).resources.crystal).toBe(9_200);
    await expect(context.service.startResearch({
      ownerEmail: context.ownerEmail,
      coordinates: context.coordinates,
      researchKey: 'computerTechnology',
    })).rejects.toMatchObject({ code: 'RESEARCH_BUSY' });

    context.advance(started.queue.durationSeconds + 1);
    await context.service.syncResearch({ ownerEmail: context.ownerEmail });
    expect(context.store.users.get(context.ownerEmail).research.energyTechnology).toBe(1);
    expect(context.store.users.get(context.ownerEmail).researchQueue).toBeNull();
  });

  it('erstattet beim Abbruch die Forschungskosten', async () => {
    const context = setup({ resources: { metal: 10_000, crystal: 10_000, deuterium: 10_000 } });
    await context.service.startResearch({ ownerEmail: context.ownerEmail, coordinates: context.coordinates, researchKey: 'energyTechnology' });
    await context.service.cancelResearch({ ownerEmail: context.ownerEmail });
    const planet = context.store.colonies.get(context.coordinates);
    expect(planet.resources.crystal).toBe(10_000);
    expect(planet.resources.deuterium).toBe(10_000);
    expect(context.store.users.get(context.ownerEmail).researchQueue).toBeNull();
  });

  it('addiert mit dem Forschungsnetzwerk die stärksten geeigneten Labore', async () => {
    const context = setup({ research: { intergalacticResearchNetwork: 2 }, labLevel: 10 });
    context.addColony('1:20:9', 8);
    context.addColony('1:20:10', 6);
    context.addColony('1:20:11', 2);
    const network = calculateResearchNetwork({
      colonies: await context.store.getUserColonies(context.ownerEmail),
      originCoordinates: context.coordinates,
      requiredLabLevel: 4,
      networkLevel: 2,
    });
    expect(network.effectiveLabLevel).toBe(24);
    expect(network.contributingLabs).toHaveLength(3);
  });

  it('verwendet die OGame-Kostenfaktoren und Forschungszeitformel', () => {
    expect(calculateResearchCost('astrophysics', 2)).toEqual({ metal: 7000, crystal: 14000, deuterium: 7000, energy: 0 });
    expect(calculateResearchDuration('energyTechnology', 1, 1)).toBe(1440);
  });
});

function colony({ coordinates, ownerEmail, labLevel, timestamp, resources = {} }) {
  return {
    coordinates,
    systemKey: coordinates.split(':').slice(0, 2).join(':'),
    ownerEmail,
    ownerName: 'Researcher',
    name: `Planet ${coordinates}`,
    colonizedAt: new Date(timestamp).toISOString(),
    planetType: 'Terranische Welt',
    fields: 180,
    diameter: 12000,
    temperature: { min: 5, max: 35 },
    bonuses: { solarEnergy: 0, deuterium: 0, resource: null },
    buildings: { researchLab: labLevel },
    buildQueue: [],
    resources: { metal: 500, crystal: 500, deuterium: 0, ...resources, lastCalculatedAt: new Date(timestamp).toISOString() },
  };
}

function clone(value) { return value == null ? value : structuredClone(value); }
