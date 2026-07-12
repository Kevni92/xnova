import { describe, expect, it } from 'vitest';
import { createShipyardService } from '../src/domain/shipyard-service.js';

class MemoryStore {
  users = new Map();
  colonies = new Map();
  async getUser(email) { return clone(this.users.get(email) ?? null); }
  async putUser(user) { this.users.set(user.email, clone(user)); }
  async getColony(coordinates) { return clone(this.colonies.get(coordinates) ?? null); }
  async putColony(colony) { this.colonies.set(colony.coordinates, clone(colony)); }
  async getUserColonies(ownerEmail) { return [...this.colonies.values()].filter((entry) => entry.ownerEmail === ownerEmail).map(clone); }
}

function setup({ research = {}, shipyardLevel = 4 } = {}) {
  const store = new MemoryStore();
  let timestamp = Date.parse('2026-07-12T12:00:00.000Z');
  const ownerEmail = 'builder@example.com';
  const coordinates = '1:20:8';
  store.users.set(ownerEmail, { email: ownerEmail, username: 'Builder', passwordHash: 'x', salt: 'y', research });
  store.colonies.set(coordinates, colony({ coordinates, ownerEmail, shipyardLevel, timestamp }));
  let counter = 0;
  const service = createShipyardService({ store, now: () => timestamp, idFactory: () => `ship-${++counter}` });
  return { store, service, ownerEmail, coordinates, advance(seconds) { timestamp += seconds * 1000; } };
}

describe('Raumschiffwerft', () => {
  it('produziert Schiffsstapel fortlaufend und schreibt fertige Einheiten gut', async () => {
    const context = setup({ research: { combustionDrive: 6 } });
    const started = await context.service.buildShips({
      ownerEmail: context.ownerEmail, coordinates: context.coordinates, shipKey: 'smallCargo', quantity: 3,
    });
    const ship = started.ships.find((entry) => entry.key === 'smallCargo');
    expect(context.store.colonies.get(context.coordinates).resources.metal).toBe(94_000);
    expect(started.queue[0].remaining).toBe(3);

    context.advance(ship.unitDurationSeconds * 2 + 1);
    const partial = await context.service.getShipyardState({ ownerEmail: context.ownerEmail, coordinates: context.coordinates });
    expect(partial.ships.find((entry) => entry.key === 'smallCargo').owned).toBe(2);
    expect(partial.queue[0].remaining).toBe(1);

    context.advance(ship.unitDurationSeconds + 1);
    const completed = await context.service.getShipyardState({ ownerEmail: context.ownerEmail, coordinates: context.coordinates });
    expect(completed.ships.find((entry) => entry.key === 'smallCargo').owned).toBe(3);
    expect(completed.queue).toHaveLength(0);
  });

  it('prüft Werft- und Forschungsvoraussetzungen', async () => {
    const context = setup({ research: { combustionDrive: 2 }, shipyardLevel: 2 });
    await expect(context.service.buildShips({
      ownerEmail: context.ownerEmail, coordinates: context.coordinates, shipKey: 'largeCargo', quantity: 1,
    })).rejects.toMatchObject({ code: 'REQUIREMENTS_MISSING' });
  });

  it('erstattet beim Abbruch nur noch nicht produzierte Einheiten zu 75 Prozent', async () => {
    const context = setup({ research: { combustionDrive: 6 } });
    const started = await context.service.buildShips({
      ownerEmail: context.ownerEmail, coordinates: context.coordinates, shipKey: 'smallCargo', quantity: 4,
    });
    const ship = started.ships.find((entry) => entry.key === 'smallCargo');
    context.advance(ship.unitDurationSeconds + 1);
    const cancelled = await context.service.cancelShipyardJob({
      ownerEmail: context.ownerEmail, coordinates: context.coordinates, jobId: started.queue[0].id,
    });
    expect(cancelled.ships.find((entry) => entry.key === 'smallCargo').owned).toBe(1);
    expect(cancelled.queue).toHaveLength(0);
    expect(context.store.colonies.get(context.coordinates).resources.metal).toBeGreaterThanOrEqual(96_500);
    expect(context.store.colonies.get(context.coordinates).resources.metal).toBeLessThan(96_501);
  });
});

function colony({ coordinates, ownerEmail, shipyardLevel, timestamp }) {
  return {
    coordinates, systemKey: '1:20', galaxy: 1, system: 20, position: 8,
    ownerEmail, ownerName: 'Builder', name: 'Nova Prime', colonizedAt: new Date(timestamp).toISOString(),
    planetType: 'Terranische Welt', fields: 180, diameter: 12000, temperature: { min: 5, max: 35 },
    bonuses: { solarEnergy: 0, deuterium: 0, resource: null },
    buildings: { shipyard: shipyardLevel, metalStorage: 6, crystalStorage: 6, deuteriumTank: 6 }, buildQueue: [],
    resources: { metal: 100_000, crystal: 100_000, deuterium: 100_000, lastCalculatedAt: new Date(timestamp).toISOString() },
    ships: {}, shipyardQueue: [],
  };
}
function clone(value) { return value == null ? value : structuredClone(value); }
