import { AuthError, createAuthService } from '../domain/auth-service.js';
import { PlanetError, createPlanetService } from '../domain/planet-service.js';
import { ResearchError, createResearchService } from '../domain/research-service.js';
import { UniverseError, createStarSystemService } from '../domain/star-system-service.js';
import { createIndexedDbStore } from './indexed-db-store.js';

const store = createIndexedDbStore();
const auth = createAuthService({ store });
const universe = createStarSystemService({ store });
const planets = createPlanetService({ store });
const research = createResearchService({ store });

const handlers = {
  register: (payload) => auth.register(payload),
  login: (payload) => auth.login(payload),
  session: () => auth.getSession(),
  setUsername: async (payload) => {
    const user = await auth.setUsername(payload);
    const homeworld = await universe.ensureHomeworld({ ownerEmail: user.email, ownerName: user.username });
    await planets.ensureActivePlanet({ ownerEmail: user.email, fallbackCoordinates: homeworld.coordinates });
    return user;
  },
  logout: () => auth.logout(),
  getGameState: async () => {
    const user = await requireUser();
    const homeworld = await universe.ensureHomeworld({ ownerEmail: user.email, ownerName: user.username });
    await planets.ensureActivePlanet({ ownerEmail: user.email, fallbackCoordinates: homeworld.coordinates });
    await research.syncResearch({ ownerEmail: user.email });
    return planets.getGameState({ ownerEmail: user.email });
  },
  selectPlanet: async (payload) => {
    const user = await requireUser();
    return planets.selectPlanet({ ownerEmail: user.email, ...payload });
  },
  getBuildingDetails: async (payload) => {
    const user = await requireUser();
    return planets.getBuildingDetails({ ownerEmail: user.email, ...payload });
  },
  upgradeBuilding: async (payload) => {
    const user = await requireUser();
    return planets.queueUpgrade({ ownerEmail: user.email, ...payload });
  },
  demolishBuilding: async (payload) => {
    const user = await requireUser();
    return planets.queueDemolition({ ownerEmail: user.email, ...payload });
  },
  cancelBuildJob: async (payload) => {
    const user = await requireUser();
    return planets.cancelBuildJob({ ownerEmail: user.email, ...payload });
  },
  getResearchState: async (payload) => {
    const user = await requireUser();
    return research.getResearchState({ ownerEmail: user.email, ...payload });
  },
  startResearch: async (payload) => {
    const user = await requireUser();
    return research.startResearch({ ownerEmail: user.email, ...payload });
  },
  cancelResearch: async () => {
    const user = await requireUser();
    return research.cancelResearch({ ownerEmail: user.email });
  },
  getSystem: async (payload) => {
    const user = await requireUser();
    await universe.ensureHomeworld({ ownerEmail: user.email, ownerName: user.username });
    return universe.getSystem({ ...payload, viewerEmail: user.email });
  },
  colonize: async (payload) => {
    const user = await requireUser();
    return universe.colonize({ ...payload, ownerEmail: user.email, ownerName: user.username });
  },
};

self.addEventListener('message', async (event) => {
  const { id, action, payload = {} } = event.data ?? {};
  if (!id || !handlers[action]) {
    self.postMessage({ id, ok: false, error: { code: 'UNKNOWN_ACTION', message: 'Unbekannte Server-Anfrage.' } });
    return;
  }
  try {
    const data = await handlers[action](payload);
    self.postMessage({ id, ok: true, data });
  } catch (error) {
    self.postMessage({ id, ok: false, error: serializeError(error) });
  }
});

async function requireUser() {
  const user = await auth.getSession();
  if (!user?.username) throw new AuthError('NOT_AUTHENTICATED', 'Du bist nicht eingeloggt.');
  return user;
}

function serializeError(error) {
  if (error instanceof AuthError || error instanceof UniverseError || error instanceof PlanetError || error instanceof ResearchError) {
    return { code: error.code, message: error.message };
  }
  console.error(error);
  return { code: 'INTERNAL_ERROR', message: 'Ein interner Fehler ist aufgetreten.' };
}
