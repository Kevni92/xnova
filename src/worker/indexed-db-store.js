const DATABASE_NAME = 'xnova-singleplayer';
const DATABASE_VERSION = 2;
const USERS_STORE = 'users';
const META_STORE = 'meta';
const COLONIES_STORE = 'colonies';
const SYSTEM_INDEX = 'systemKey';
const SESSION_KEY = 'current-session';

export function createIndexedDbStore(indexedDb = globalThis.indexedDB) {
  if (!indexedDb) {
    throw new Error('IndexedDB ist nicht verfügbar.');
  }

  const databasePromise = openDatabase(indexedDb);

  return {
    async getUser(email) {
      return request(databasePromise, USERS_STORE, 'readonly', (store) => store.get(email));
    },

    async putUser(user) {
      await request(databasePromise, USERS_STORE, 'readwrite', (store) => store.put(user));
    },

    async getSessionEmail() {
      const record = await request(databasePromise, META_STORE, 'readonly', (store) =>
        store.get(SESSION_KEY),
      );
      return record?.email ?? null;
    },

    async setSessionEmail(email) {
      await request(databasePromise, META_STORE, 'readwrite', (store) =>
        store.put({ key: SESSION_KEY, email }),
      );
    },

    async clearSession() {
      await request(databasePromise, META_STORE, 'readwrite', (store) =>
        store.delete(SESSION_KEY),
      );
    },

    async getColony(coordinates) {
      return request(databasePromise, COLONIES_STORE, 'readonly', (store) => store.get(coordinates));
    },

    async getColoniesInSystem(systemKey) {
      return request(databasePromise, COLONIES_STORE, 'readonly', (store) =>
        store.index(SYSTEM_INDEX).getAll(systemKey),
      );
    },

    async addColony(colony) {
      await request(databasePromise, COLONIES_STORE, 'readwrite', (store) => store.add(colony));
    },
  };
}

function openDatabase(indexedDb) {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDb.open(DATABASE_NAME, DATABASE_VERSION);

    openRequest.onupgradeneeded = () => {
      const database = openRequest.result;
      if (!database.objectStoreNames.contains(USERS_STORE)) {
        database.createObjectStore(USERS_STORE, { keyPath: 'email' });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
      }

      const coloniesStore = database.objectStoreNames.contains(COLONIES_STORE)
        ? openRequest.transaction.objectStore(COLONIES_STORE)
        : database.createObjectStore(COLONIES_STORE, { keyPath: 'coordinates' });

      if (!coloniesStore.indexNames.contains(SYSTEM_INDEX)) {
        coloniesStore.createIndex(SYSTEM_INDEX, SYSTEM_INDEX, { unique: false });
      }
    };

    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror = () => reject(openRequest.error);
  });
}

async function request(databasePromise, storeName, mode, operation) {
  const database = await databasePromise;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const objectStore = transaction.objectStore(storeName);
    const operationRequest = operation(objectStore);

    operationRequest.onsuccess = () => resolve(operationRequest.result);
    operationRequest.onerror = () => reject(operationRequest.error);
    transaction.onerror = () => reject(transaction.error);
  });
}
