import { describe, expect, it } from 'vitest';
import { STAR_SYSTEM_RULES, createStarSystemService } from '../src/domain/star-system-service.js';

class MemoryStore {
  colonies = new Map();
  async getColony(coordinates) { return clone(this.colonies.get(coordinates) ?? null); }
  async getColoniesInSystem(systemKey) { return [...this.colonies.values()].filter((entry) => entry.systemKey === systemKey).map(clone); }
  async getUserColonies(ownerEmail) { return [...this.colonies.values()].filter((entry) => entry.ownerEmail === ownerEmail).map(clone); }
  async putColony(colony) { this.colonies.set(colony.coordinates, clone(colony)); }
  async addColony(colony) {
    if (this.colonies.has(colony.coordinates)) throw new DOMException('Position belegt', 'ConstraintError');
    this.colonies.set(colony.coordinates, clone(colony));
  }
}

function setup(seed = 'test-seed') {
  const store = new MemoryStore();
  const universe = createStarSystemService({ store, universeSeed: seed, now: () => '2026-07-11T12:00:00.000Z' });
  return { store, universe };
}
const owner = { ownerEmail: 'pilot@example.com', ownerName: 'Pilot_1' };

describe('Sternsystem-Service', () => {
  it('zeigt für freie Positionen keine verborgenen Planeteneigenschaften', async () => {
    const { universe } = setup();
    const system = await universe.getSystem({ galaxy: 1, system: 24, viewerEmail: owner.ownerEmail });
    expect(system.positions).toHaveLength(STAR_SYSTEM_RULES.positionsPerSystem);
    expect(system.positions[0]).toEqual({ position: 1, occupied: false });
  });

  it('enthüllt Eigenschaften erst nach der Kolonisierung und speichert sie', async () => {
    const { universe } = setup();
    const colony = await universe.colonize({ ...owner, galaxy: 1, system: 24, position: 10 });
    const system = await universe.getSystem({ galaxy: 1, system: 24, viewerEmail: owner.ownerEmail });
    expect(system.positions.find((entry) => entry.position === 10).colony).toEqual(colony);
  });

  it('erzeugt für dieselbe Koordinate deterministische Werte', async () => {
    const first = setup('stable-seed').universe;
    const second = setup('stable-seed').universe;
    expect(await first.colonize({ ...owner, galaxy: 2, system: 18, position: 4 }))
      .toEqual(await second.colonize({ ...owner, galaxy: 2, system: 18, position: 4 }));
  });

  it('vergibt jedem Spieler eine freie Heimatwelt mit exakt 180 Feldern', async () => {
    const { universe } = setup();
    const first = await universe.ensureHomeworld(owner);
    const repeated = await universe.ensureHomeworld(owner);
    const second = await universe.ensureHomeworld({ ownerEmail: 'second@example.com', ownerName: 'Second' });
    expect(first).toEqual(repeated);
    expect(first.fields).toBe(180);
    expect(second.fields).toBe(180);
    expect(second.coordinates).not.toBe(first.coordinates);
  });

  it('verhindert eine erneute Belegung derselben Position', async () => {
    const { universe } = setup();
    const coordinates = { ...owner, galaxy: 3, system: 40, position: 9 };
    await universe.colonize(coordinates);
    await expect(universe.colonize(coordinates)).rejects.toMatchObject({ code: 'POSITION_OCCUPIED' });
  });
});

function clone(value) { return value == null ? value : structuredClone(value); }
