import { AuthError, createAuthService } from '../domain/auth-service.js';
import { createIndexedDbStore } from './indexed-db-store.js';

const auth = createAuthService({ store: createIndexedDbStore() });

const handlers = {
  register: (payload) => auth.register(payload),
  login: (payload) => auth.login(payload),
  session: () => auth.getSession(),
  setUsername: (payload) => auth.setUsername(payload),
  logout: () => auth.logout(),
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

function serializeError(error) {
  if (error instanceof AuthError) {
    return { code: error.code, message: error.message };
  }

  console.error(error);
  return {
    code: 'INTERNAL_ERROR',
    message: 'Ein interner Fehler ist aufgetreten.',
  };
}
