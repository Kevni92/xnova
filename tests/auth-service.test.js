import { describe, expect, it } from 'vitest';
import { createAuthService } from '../src/domain/auth-service.js';

class MemoryStore {
  users = new Map();
  sessionEmail = null;

  async getUser(email) {
    const user = this.users.get(email);
    return user ? structuredClone(user) : null;
  }

  async putUser(user) {
    this.users.set(user.email, structuredClone(user));
  }

  async getSessionEmail() {
    return this.sessionEmail;
  }

  async setSessionEmail(email) {
    this.sessionEmail = email;
  }

  async clearSession() {
    this.sessionEmail = null;
  }
}

function setup() {
  const store = new MemoryStore();
  const auth = createAuthService({ store, iterations: 100 });
  return { auth, store };
}

describe('Auth-Service', () => {
  it('registriert und normalisiert eine E-Mail-Adresse', async () => {
    const { auth, store } = setup();

    await expect(
      auth.register({ email: '  Pilot@Example.com ', password: 'geheim123' }),
    ).resolves.toEqual({ email: 'pilot@example.com' });

    expect(store.users.get('pilot@example.com')).toMatchObject({
      email: 'pilot@example.com',
      username: null,
    });
    expect(store.users.get('pilot@example.com').passwordHash).not.toBe('geheim123');
  });

  it('verhindert doppelte Registrierung', async () => {
    const { auth } = setup();
    const account = { email: 'pilot@example.com', password: 'geheim123' };

    await auth.register(account);

    await expect(auth.register(account)).rejects.toMatchObject({ code: 'EMAIL_TAKEN' });
  });

  it('lehnt falsche Zugangsdaten ab', async () => {
    const { auth } = setup();
    await auth.register({ email: 'pilot@example.com', password: 'geheim123' });

    await expect(
      auth.login({ email: 'pilot@example.com', password: 'anderes123' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('bildet den vollständigen Login-, Username- und Logout-Ablauf ab', async () => {
    const { auth } = setup();
    await auth.register({ email: 'pilot@example.com', password: 'geheim123' });

    await expect(
      auth.login({ email: 'pilot@example.com', password: 'geheim123' }),
    ).resolves.toEqual({ email: 'pilot@example.com', username: null });

    await expect(auth.setUsername({ username: 'Commander_7' })).resolves.toEqual({
      email: 'pilot@example.com',
      username: 'Commander_7',
    });

    await expect(auth.getSession()).resolves.toEqual({
      email: 'pilot@example.com',
      username: 'Commander_7',
    });

    await auth.logout();
    await expect(auth.getSession()).resolves.toBeNull();
  });
});
