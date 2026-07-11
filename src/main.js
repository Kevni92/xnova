import './styles.css';
import './showcase.css';
import { WorkerClient } from './client/worker-client.js';
import { bindUiShowcase, renderUiShowcase } from './ui-showcase.js';

const app = document.querySelector('#app');
const worker = new Worker(new URL('./worker/server.worker.js', import.meta.url), { type: 'module' });
const server = new WorkerClient(worker);

let notice = null;

start();

async function start() {
  renderLoading();

  try {
    const user = await server.call('session');
    renderForUser(user);
  } catch (error) {
    renderFatalError(error.message);
  }
}

function renderForUser(user) {
  if (!user) {
    renderAuth();
    return;
  }

  if (!user.username) {
    renderUsernameSetup(user);
    return;
  }

  renderDashboard(user);
}

function renderAuth() {
  app.innerHTML = page(`
    <section class="card auth-grid" data-testid="auth-screen">
      <div>
        <p class="eyebrow">XNOVA Singleplayer</p>
        <h1>Willkommen im Universum</h1>
        <p class="muted">Dein lokaler Spielserver läuft direkt in einem Web Worker.</p>
        ${noticeMarkup()}
      </div>

      <div class="forms">
        <form id="register-form" class="panel">
          <h2>Registrieren</h2>
          <label>
            E-Mail
            <input data-testid="register-email" name="email" type="email" autocomplete="email" required />
          </label>
          <label>
            Passwort
            <input data-testid="register-password" name="password" type="password" autocomplete="new-password" minlength="8" required />
          </label>
          <button data-testid="register-submit" type="submit">Account erstellen</button>
        </form>

        <form id="login-form" class="panel">
          <h2>Einloggen</h2>
          <label>
            E-Mail
            <input data-testid="login-email" name="email" type="email" autocomplete="email" required />
          </label>
          <label>
            Passwort
            <input data-testid="login-password" name="password" type="password" autocomplete="current-password" minlength="8" required />
          </label>
          <button data-testid="login-submit" type="submit">Einloggen</button>
        </form>
      </div>
    </section>
  `);

  document.querySelector('#register-form').addEventListener('submit', handleRegister);
  document.querySelector('#login-form').addEventListener('submit', handleLogin);
}

function renderUsernameSetup(user) {
  app.innerHTML = page(`
    <section class="card compact" data-testid="username-screen">
      <p class="eyebrow">Erster Login</p>
      <h1>Wähle deinen Username</h1>
      <p class="muted">Account: ${escapeHtml(user.email)}</p>
      ${noticeMarkup()}
      <form id="username-form" class="panel">
        <label>
          Username
          <input data-testid="username-input" name="username" type="text" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" autocomplete="username" required />
        </label>
        <button data-testid="username-submit" type="submit">Username speichern</button>
      </form>
    </section>
  `);

  document.querySelector('#username-form').addEventListener('submit', handleUsername);
}

function renderDashboard(user) {
  app.innerHTML = page(renderUiShowcase(user), 'game-root');
  bindUiShowcase({ onLogout: handleLogout });
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);

  try {
    await server.call('register', {
      email: values.get('email'),
      password: values.get('password'),
    });
    notice = { type: 'success', text: 'Registrierung erfolgreich. Bitte logge dich jetzt ein.' };
    renderAuth();
  } catch (error) {
    notice = { type: 'error', text: error.message };
    renderAuth();
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);

  try {
    const user = await server.call('login', {
      email: values.get('email'),
      password: values.get('password'),
    });
    notice = null;
    renderForUser(user);
  } catch (error) {
    notice = { type: 'error', text: error.message };
    renderAuth();
  }
}

async function handleUsername(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const values = new FormData(form);
  setBusy(form, true);

  try {
    const user = await server.call('setUsername', { username: values.get('username') });
    notice = null;
    renderDashboard(user);
  } catch (error) {
    notice = { type: 'error', text: error.message };
    const user = await server.call('session');
    renderUsernameSetup(user);
  }
}

async function handleLogout(event) {
  event.currentTarget.disabled = true;
  await server.call('logout');
  notice = { type: 'success', text: 'Du wurdest ausgeloggt.' };
  renderAuth();
}

function renderLoading() {
  app.innerHTML = page('<section class="card compact centered"><p>Lokaler Spielserver wird gestartet …</p></section>');
}

function renderFatalError(message) {
  app.innerHTML = page(`
    <section class="card compact">
      <h1>Start fehlgeschlagen</h1>
      <p class="notice error">${escapeHtml(message)}</p>
    </section>
  `);
}

function noticeMarkup() {
  if (!notice) {
    return '';
  }

  return `<p class="notice ${notice.type}" data-testid="notice">${escapeHtml(notice.text)}</p>`;
}

function page(content, className = 'shell') {
  return `<div class="${className}">${content}</div>`;
}

function setBusy(form, busy) {
  for (const element of form.elements) {
    element.disabled = busy;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
