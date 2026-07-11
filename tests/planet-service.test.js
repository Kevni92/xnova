import { describe, expect, it } from 'vitest';
import { createPlanetService } from '../src/domain/planet-service.js';

class MemoryStore {
  colonies = new Map();
  active = new Map();

  async getColony(coordinates) { return clone(this.colonies.get(coordinates) ?? null); }
  async putColony(colony) { this.colonies.set(colony.coordinates, clone(colony)); }
  async getUserColonies(ownerEmail) { return [...this.colonies.values()].filter((entry) => entry.ownerEmail === ownerEmail).map(clone); }
  async getActivePlanet(ownerEmail) { return this.active.get(ownerEmail) ?? null; }
  async setActivePlanet(ownerEmail, coordinates) { this.active.set(ownerEmail, coordinates); }
}

function setup(overrides = {}) {
  const store = new MemoryStore();
  let timestamp = Date.parse('2026-07-11T12:00:00.000Z');
  const colony = {
    coordinates: '1:20:8', systemKey: '1:20', galaxy: 1, system: 20, position: 8,
    ownerEmail: 'pilot@example.com', ownerName: 'Pilot', name: 'Nova Prime',
    colonizedAt: new Date(timestamp).toISOString(), planetType: 'Terranische Welt', fields: 180,
    diameter: 12000, temperature: { min: 5, max: 35 },
    bonuses: { solarEnergy: 0, deuterium: 0, resource: null },
    ...overrides,
  };
  store.colonies.set(colony.coordinates, clone(colony));
  store.active.set(colony.ownerEmail, colony.coordinates);
  let counter = 0;
  const service = createPlanetService({ store, now: () => timestamp, idFactory: () => `job-${++counter}` });
  return {
    store, service, ownerEmail: colony.ownerEmail, coordinates: colony.coordinates,
    advance(seconds) { timestamp += seconds * 1000; },
  };
}

describe('Planetare Wirtschaft und Gebäude', () => {
  it('materialisiert Grundproduktion anhand der vergangenen Zeit', async () => {
    const context = setup();
    context.advance(3600);
    const state = await context.service.getGameState({ ownerEmail: context.ownerEmail });
    expect(state.activePlanet.resources).toEqual({ metal: 530, crystal: 515, deuterium: 0 });
  });

  it('zieht Ausbaukosten sofort ab und stellt das Gebäude nach Ablauf fertig', async () => {
    const context = setup({ buildings: { solarPlant: 1 } });
    const queued = await context.service.queueUpgrade({
      ownerEmail: context.ownerEmail,
      coordinates: context.coordinates,
      buildingKey: 'metalMine',
    });
    expect(queued.resources.metal).toBe(440);
    expect(queued.resources.crystal).toBe(485);
    expect(queued.buildQueue).toHaveLength(1);

    context.advance(25);
    const state = await context.service.getGameState({ ownerEmail: context.ownerEmail });
    expect(state.activePlanet.buildings.metalMine).toBe(1);
    expect(state.activePlanet.buildQueue).toHaveLength(0);
    expect(state.activePlanet.production.metal).toBeGreaterThan(30);
  });

  it('unterstützt Folgeaufträge und berechnet die vorgemerkte Zielstufe', async () => {
    const context = setup({ resources: { metal: 5000, crystal: 5000, deuterium: 5000, lastCalculatedAt: '2026-07-11T12:00:00.000Z' } });
    await context.service.queueUpgrade({ ownerEmail: context.ownerEmail, coordinates: context.coordinates, buildingKey: 'metalMine' });
    await context.service.queueUpgrade({ ownerEmail: context.ownerEmail, coordinates: context.coordinates, buildingKey: 'metalMine' });
    const state = await context.service.getGameState({ ownerEmail: context.ownerEmail });
    const mine = state.buildings.find((entry) => entry.key === 'metalMine');
    expect(state.activePlanet.buildQueue).toHaveLength(2);
    expect(mine.currentLevel).toBe(0);
    expect(mine.projectedLevel).toBe(2);
    expect(mine.nextLevel).toBe(3);
  });

  it('erstattet beim Abbruch 75 Prozent der ursprünglichen Kosten', async () => {
    const context = setup();
    const queued = await context.service.queueUpgrade({ ownerEmail: context.ownerEmail, coordinates: context.coordinates, buildingKey: 'metalMine' });
    const cancelled = await context.service.cancelBuildJob({
      ownerEmail: context.ownerEmail,
      coordinates: context.coordinates,
      jobId: queued.buildQueue[0].id,
    });
    expect(cancelled.buildQueue).toHaveLength(0);
    expect(cancelled.resources.metal).toBe(485);
    expect(cancelled.resources.crystal).toBe(496);
  });

  it('reiht einen kostenpflichtigen Abriss ein und gibt nach Abschluss ein Feld frei', async () => {
    const context = setup({
      buildings: { metalMine: 1 },
      resources: { metal: 500, crystal: 500, deuterium: 0, lastCalculatedAt: '2026-07-11T12:00:00.000Z' },
    });
    const queued = await context.service.queueDemolition({ ownerEmail: context.ownerEmail, coordinates: context.coordinates, buildingKey: 'metalMine' });
    expect(queued.resources.metal).toBeLessThan(500);
    expect(queued.buildQueue[0].action).toBe('demolish');
    context.advance(30);
    const state = await context.service.getGameState({ ownerEmail: context.ownerEmail });
    expect(state.activePlanet.buildings.metalMine).toBe(0);
    expect(state.activePlanet.usedFields).toBe(0);
  });

  it('zeigt bei unbegrenzten Gebäudestufen die aktuelle und nächsten zehn Stufen', async () => {
    const context = setup({ buildings: { metalMine: 120 } });
    const detail = await context.service.getBuildingDetails({ ownerEmail: context.ownerEmail, coordinates: context.coordinates, buildingKey: 'metalMine' });
    expect(detail.levels).toHaveLength(11);
    expect(detail.levels[0].level).toBe(120);
    expect(detail.levels.at(-1).level).toBe(130);
  });
});

function clone(value) { return value == null ? value : structuredClone(value); }
