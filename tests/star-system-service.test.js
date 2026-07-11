import { describe, expect, it } from 'vitest';
import { STAR_SYSTEM_RULES, createStarSystemService } from '../src/domain/star-system-service.js';

class MemoryStore {
  colonies = new Map();

  async getColony(coordinates) {
    const colony = this.colonies.get(coordinates);
    return colony ? structuredClone(colony) : null;
  }

  async getColoniesInSystem(systemKey) {
    return [...this.colonies.values()]
      .filter((colony) => colony.systemKey === systemKey)
      .map((colony) => structuredClone(colony));
  }

  async addColony(colony) {
    if (this.colonies.has(colony.coordinates)) {
      throw new DOMException('Position belegt', 'ConstraintError');
    }
    this.colonies.set(colony.coordinates, structuredClone(colony));
  }
}

function setup(seed = 'test-seed') {
  const store = new MemoryStore();
  const universe = createStarSystemService({
    store,
    universeSeed: seed,
    now: () => '2026-07-11T12:00:00.000Z',
  });
  return { store, universe };
}

const owner = { ownerEmail: 'pilot@example.com', ownerName: 'Pilot_1' };

describe('Sternsystem-Service', () => {
  it('zeigt für freie Positionen keine verborgenen Planeteneigenschaften', async () => {
    const { universe } = setup();

    const system = await universe.getSystem({ galaxy: 1, system: 24, viewerEmail: owner.ownerEmail });

    expect(system.positions).toHaveLength(STAR_SYSTEM_RULES.positionsPerSystem);
    expect(system.positions[0]).toEqual({ position: 1, occupied: false });
    expect(system.star).toMatchObject({ key: expect.any(String), label: expect.any(String) });
  });

  it('enthüllt Eigenschaften erst nach der Kolonisierung und speichert sie', async () => {
    const { universe } = setup();

    const colony = await universe.colonize({ ...owner, galaxy: 1, system: 24, position: 10 });
    const system = await universe.getSystem({ galaxy: 1, system: 24, viewerEmail: owner.ownerEmail });
    const position = system.positions.find((entry) => entry.position === 10);

    expect(colony).toMatchObject({
      coordinates: '1:24:10',
      fields: expect.any(Number),
      temperature: { min: expect.any(Number), max: expect.any(Number) },
      bonuses: { solarEnergy: expect.any(Number), deuterium: 15 },
    });
    expect(position.occupied).toBe(true);
    expect(position.colony).toEqual(colony);
  });

  it('erzeugt für dieselbe Koordinate immer dieselben Werte', async () => {
    const first = setup('stable-seed').universe;
    const second = setup('stable-seed').universe;

    const firstColony = await first.colonize({ ...owner, galaxy: 2, system: 18, position: 4 });
    const secondColony = await second.colonize({ ...owner, galaxy: 2, system: 18, position: 4 });

    expect(firstColony).toEqual(secondColony);
  });

  it('wendet die festgelegten Positionsprofile an', async () => {
    const { universe } = setup();
    const expectations = [
      { position: 1, fields: [80, 150], deuterium: -20 },
      { position: 4, fields: [120, 190], deuterium: -10 },
      { position: 7, fields: [160, 250], deuterium: 0 },
      { position: 10, fields: [130, 210], deuterium: 15 },
      { position: 13, fields: [90, 170], deuterium: 30 },
    ];

    for (const expected of expectations) {
      const colony = await universe.colonize({
        ...owner,
        galaxy: 1,
        system: 30,
        position: expected.position,
      });
      expect(colony.fields).toBeGreaterThanOrEqual(expected.fields[0]);
      expect(colony.fields).toBeLessThanOrEqual(expected.fields[1]);
      expect(colony.bonuses.deuterium).toBe(expected.deuterium);
      expect(Math.abs(colony.bonuses.solarEnergy)).toBeLessThanOrEqual(30);
    }
  });

  it('verhindert eine erneute Belegung derselben Position', async () => {
    const { universe } = setup();
    const coordinates = { ...owner, galaxy: 3, system: 40, position: 9 };

    await universe.colonize(coordinates);

    await expect(universe.colonize(coordinates)).rejects.toMatchObject({ code: 'POSITION_OCCUPIED' });
  });

  it('legt die Heimatwelt auf Position 1:24:8 genau einmal an', async () => {
    const { universe } = setup();

    const first = await universe.ensureHomeworld(owner);
    const second = await universe.ensureHomeworld(owner);

    expect(first).toEqual(second);
    expect(first).toMatchObject({ coordinates: '1:24:8', name: 'Nova Prime', ownedByViewer: true });
  });
});
