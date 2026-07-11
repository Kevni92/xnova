const DEFAULT_ITERATIONS = 150_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

export class AuthError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export function createAuthService({
  store,
  cryptoApi = globalThis.crypto,
  iterations = DEFAULT_ITERATIONS,
  now = () => new Date().toISOString(),
}) {
  if (!store) {
    throw new Error('Ein Speicheradapter ist erforderlich.');
  }

  if (!cryptoApi?.subtle || !cryptoApi?.getRandomValues) {
    throw new Error('Web Crypto ist nicht verfügbar.');
  }

  async function register({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    validateEmail(normalizedEmail);
    validatePassword(password);

    if (await store.getUser(normalizedEmail)) {
      throw new AuthError('EMAIL_TAKEN', 'Diese E-Mail-Adresse ist bereits registriert.');
    }

    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const passwordHash = await hashPassword(password, salt, cryptoApi, iterations);

    await store.putUser({
      email: normalizedEmail,
      passwordHash,
      salt: bytesToHex(salt),
      username: null,
      createdAt: now(),
    });

    return { email: normalizedEmail };
  }

  async function login({ email, password }) {
    const normalizedEmail = normalizeEmail(email);
    validateEmail(normalizedEmail);
    validatePassword(password);

    const user = await store.getUser(normalizedEmail);
    if (!user) {
      throw invalidCredentials();
    }

    const candidateHash = await hashPassword(
      password,
      hexToBytes(user.salt),
      cryptoApi,
      iterations,
    );

    if (!constantTimeEqual(candidateHash, user.passwordHash)) {
      throw invalidCredentials();
    }

    await store.setSessionEmail(user.email);
    return publicUser(user);
  }

  async function getSession() {
    const email = await store.getSessionEmail();
    if (!email) {
      return null;
    }

    const user = await store.getUser(email);
    if (!user) {
      await store.clearSession();
      return null;
    }

    return publicUser(user);
  }

  async function setUsername({ username }) {
    const email = await store.getSessionEmail();
    if (!email) {
      throw new AuthError('NOT_AUTHENTICATED', 'Du bist nicht eingeloggt.');
    }

    const normalizedUsername = String(username ?? '').trim();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      throw new AuthError(
        'INVALID_USERNAME',
        'Der Username muss 3 bis 20 Zeichen lang sein und darf nur Buchstaben, Zahlen und Unterstriche enthalten.',
      );
    }

    const user = await store.getUser(email);
    if (!user) {
      await store.clearSession();
      throw new AuthError('NOT_AUTHENTICATED', 'Du bist nicht eingeloggt.');
    }

    user.username = normalizedUsername;
    await store.putUser(user);
    return publicUser(user);
  }

  async function logout() {
    await store.clearSession();
    return null;
  }

  return {
    register,
    login,
    getSession,
    setUsername,
    logout,
  };
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function validateEmail(email) {
  if (!EMAIL_PATTERN.test(email)) {
    throw new AuthError('INVALID_EMAIL', 'Bitte gib eine gültige E-Mail-Adresse ein.');
  }
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new AuthError('INVALID_PASSWORD', 'Das Passwort muss mindestens 8 Zeichen lang sein.');
  }
}

function invalidCredentials() {
  return new AuthError('INVALID_CREDENTIALS', 'E-Mail-Adresse oder Passwort ist falsch.');
}

async function hashPassword(password, salt, cryptoApi, iterations) {
  const key = await cryptoApi.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await cryptoApi.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    key,
    256,
  );

  return bytesToHex(new Uint8Array(bits));
}

function publicUser(user) {
  return {
    email: user.email,
    username: user.username,
  };
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  if (typeof hex !== 'string' || hex.length % 2 !== 0) {
    throw new Error('Ungültiger Hex-Wert.');
  }

  return new Uint8Array(hex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return difference === 0;
}
