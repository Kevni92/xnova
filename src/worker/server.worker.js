import { AuthError, createAuthService } from '../domain/auth-service.js';
import { UniverseError, createStarSystemService } from '../domain/star-system-service.js';
import { createIndexedDbStore } from './indexed-db-store.js';

const store = createIndexedDbStore();
const auth = createAuthService({ store });
const universe = createStarSystemService({ store });

const handlers = {
  register: (payload) => auth.register(payload),
  login: (payload) => auth.login(payload),
  session: () => auth.getSession(),
  setUsername: async (payload) => {
    const user = await auth.setUsername(payload);
    await universe.ensureHomeworld({ ownerEmail: user.email, ownerName: user.username });
    return user;
  },
  logout: () => auth.logout(),
  getSystem: async (payload) => {
    const user = await requireUser();
    await universe.ensureHomeworld({ ownerEmail: user.email, ownerName: user.username });
    return universe.getSystem({ ...payload, viewerEmail: user.email });
  },
  colonize: async (payload) => {
    const user = await requireUser();
    return universe.colonize({
      ...payload,
      ownerEmail: user.email,
      ownerName: user.username,
    });
  },
};

self.addEventListener('message', async (event) => {
  const { id, action, payload = {} } = event.data ?? {};

  if (!id || !handlers[action]) {
    self.postMessage({
      id,
      ok: false,
      error: {
        code: 'UNKNOWN_ACTION',
        message: 'Unbekannte Server-Anfrage.',
      },
    });
    return;
  }

  try {
    const data = await handlers[action](payload);
    self.postMessage({ id, ok: true, data });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: serializeError(error),
    });
  }
});

async function requireUser() {
  const user = await auth.getSession();
  if (!user?.username) {
    throw new AuthError('NOT_AUTHENTICATED', 'Du bist nicht eingeloggt.');
  }
  return user;
}

function serializeError(error) {
  if (error instanceof AuthError || error instanceof UniverseError) {
    return { code: error.code, message: error.message };
  }

  console.error(error);
  return {
    code: 'INTERNAL_ERROR',
    message: 'Ein interner Fehler ist aufgetreten.',
  };
}
