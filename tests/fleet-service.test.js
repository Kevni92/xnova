import { describe, expect, it } from 'vitest';
import { calculateDistance, calculateFlightDuration, createFleetService } from '../src/domain/fleet-service.js';

class MemoryStore {
  users = new Map();
  colonies = new Map();
  async getUser(email) { return clone(this.users.get(email) ?? null); }
  async putUser(user) { this.users.set(user.email, clone(user)); }
  async getColony(coordinates) { return clone(this.colonies.get(coordinates) ?? null); }
  async putColony(colony) { this.colonies.set(colony.coordinates, clone(colony)); }
  async getUserColonies(ownerEmail) { return [...this.colonies.values()].filter((entry) => entry.ownerEmail === ownerEmail).map(clone); }
}

function setup() {
  const store = new MemoryStore();
  let timestamp = Date.parse('2026-07-12T12:00:00.000Z');
  const ownerEmail = 'pilot@example.com';
  store.users.set(ownerEmail, {
    email: ownerEmail, username: 'Pilot', passwordHash: 'x', salt: 'y',
    research: { combustionDrive: 6, computerTechnology: 2 },
  });
  store.colonies.set('1:20:8', colony({ coordinates: '1:20:8', ownerEmail, ownerName: 'Pilot', name: 'Nova Prime', timestamp, ships: { smallCargo: 5 } }));
  store.colonies.set('1:20:10', colony({ coordinates: '1:20:10', ownerEmail, ownerName: 'Pilot', name: 'Luna', timestamp }));
  store.colonies.set('1:20:12', colony({ coordinates: '1:20:12', ownerEmail: 'other@example.com', ownerName: 'Rival', name: 'Rivalis', timestamp }));
  let counter = 0;
  const service = createFleetService({ store, now: () => timestamp, idFactory: () => `fleet-${++counter}` });
  return { store, service, ownerEmail, advance(seconds) { timestamp += seconds * 1000; } };
}

describe('Flottenmissionen', () => {
  it('liefert bei Transport Fracht ab und bringt die Schiffe zurück', async () => {
    const context = setup();
    const launched = await context.service.launchFleet({
      ownerEmail: context.ownerEmail,
      coordinates: '1:20:8',
      targetCoordinates: '1:20:10',
      mission: 'transport',
      speedPercent: 100,
      ships: { smallCargo: 2 },
      cargo: { metal: 2000, crystal: 1000, deuterium: 0 },
    });
    const duration = launched.activeFleets[0].durationSeconds;
    expect(launched.ships.find((entry) => entry.key === 'smallCargo').available).toBe(3);

    context.advance(duration + 1);
    const returning = await context.service.getFleetState({ ownerEmail: context.ownerEmail, coordinates: '1:20:8' });
    expect(returning.activeFleets[0].phase).toBe('returning');
    expect(context.store.colonies.get('1:20:10').resources.metal).toBeGreaterThanOrEqual(102_000);

    context.advance(duration + 1);
    const completed = await context.service.getFleetState({ ownerEmail: context.ownerEmail, coordinates: '1:20:8' });
    expect(completed.activeFleets).toHaveLength(0);
    expect(completed.ships.find((entry) => entry.key === 'smallCargo').available).toBe(5);
  });

  it('stationiert Schiffe und Fracht dauerhaft auf einem eigenen Planeten', async () => {
    const context = setup();
    const launched = await context.service.launchFleet({
      ownerEmail: context.ownerEmail,
      coordinates: '1:20:8',
      targetCoordinates: '1:20:10',
      mission: 'station',
      speedPercent: 100,
      ships: { smallCargo: 3 },
      cargo: { metal: 0, crystal: 500, deuterium: 0 },
    });
    context.advance(launched.activeFleets[0].durationSeconds + 1);
    await context.service.syncFleets({ ownerEmail: context.ownerEmail });
    expect(context.store.users.get(context.ownerEmail).fleets).toHaveLength(0);
    expect(context.store.colonies.get('1:20:10').ships.smallCargo).toBe(3);
    expect(context.store.colonies.get('1:20:10').resources.crystal).toBeGreaterThanOrEqual(100_500);
  });

  it('verhindert Stationierung auf einem fremden Planeten', async () => {
    const context = setup();
    await expect(context.service.launchFleet({
      ownerEmail: context.ownerEmail,
      coordinates: '1:20:8',
      targetCoordinates: '1:20:12',
      mission: 'station',
      speedPercent: 100,
      ships: { smallCargo: 1 },
      cargo: {},
    })).rejects.toMatchObject({ code: 'FOREIGN_STATION' });
  });

  it('ruft eine Flotte vor der Ankunft mit Schiffen und Fracht zurück', async () => {
    const context = setup();
    const launched = await context.service.launchFleet({
      ownerEmail: context.ownerEmail,
      coordinates: '1:20:8',
      targetCoordinates: '1:20:10',
      mission: 'transport',
      speedPercent: 100,
      ships: { smallCargo: 1 },
      cargo: { metal: 1000, crystal: 0, deuterium: 0 },
    });
    context.advance(20);
    const recalled = await context.service.recallFleet({ ownerEmail: context.ownerEmail, fleetId: launched.activeFleets[0].id });
    expect(recalled.returnAt).toBeTruthy();
    context.advance(21);
    const completed = await context.service.getFleetState({ ownerEmail: context.ownerEmail, coordinates: '1:20:8' });
    expect(completed.activeFleets).toHaveLength(0);
    expect(completed.ships.find((entry) => entry.key === 'smallCargo').available).toBe(5);
    expect(context.store.colonies.get('1:20:8').resources.metal).toBeGreaterThanOrEqual(100_000);
  });

  it('berechnet Entfernung und Flugzeit deterministisch', () => {
    const distance = calculateDistance('1:20:8', '1:21:8');
    expect(distance).toBe(2795);
    expect(calculateFlightDuration(distance, 8000, 100)).toBeGreaterThan(0);
  });
});

function colony({ coordinates, ownerEmail, ownerName, name, timestamp, ships = {} }) {
  const [galaxy, system, position] = coordinates.split(':').map(Number);
  return {
    coordinates, systemKey: `${galaxy}:${system}`, galaxy, system, position,
    ownerEmail, ownerName, name, colonizedAt: new Date(timestamp).toISOString(),
    planetType: 'Terranische Welt', fields: 180, diameter: 12000, temperature: { min: 5, max: 35 },
    bonuses: { solarEnergy: 0, deuterium: 0, resource: null },
    buildings: { shipyard: 4, metalStorage: 6, crystalStorage: 6, deuteriumTank: 6 }, buildQueue: [],
    resources: { metal: 100_000, crystal: 100_000, deuterium: 100_000, lastCalculatedAt: new Date(timestamp).toISOString() },
    ships, shipyardQueue: [],
  };
}
function clone(value) { return value == null ? value : structuredClone(value); }
