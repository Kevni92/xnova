export class WorkerClient {
  constructor(worker) {
    this.worker = worker;
    this.requests = new Map();
    this.nextId = 1;

    worker.addEventListener('message', (event) => {
      const response = event.data;
      const request = this.requests.get(response?.id);
      if (!request) {
        return;
      }

      this.requests.delete(response.id);
      if (response.ok) {
        request.resolve(response.data);
      } else {
        const error = new Error(response.error?.message ?? 'Unbekannter Fehler.');
        error.code = response.error?.code ?? 'UNKNOWN_ERROR';
        request.reject(error);
      }
    });

    worker.addEventListener('error', () => {
      for (const request of this.requests.values()) {
        request.reject(new Error('Der lokale Spielserver konnte nicht gestartet werden.'));
      }
      this.requests.clear();
    });
  }

  call(action, payload = {}) {
    const id = this.nextId;
    this.nextId += 1;

    return new Promise((resolve, reject) => {
      this.requests.set(id, { resolve, reject });
      this.worker.postMessage({ id, action, payload });
    });
  }
}
