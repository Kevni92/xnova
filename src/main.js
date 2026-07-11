import './styles.css';
import { WorkerClient } from './client/worker-client.js';
import { mountGameFeature } from './game-ui.js';

const app = document.querySelector('#app');
const worker = new Worker(new URL('./worker/server.worker.js', import.meta.url), { type: 'module' });
const server = new WorkerClient(worker);
let notice = null;
let cleanupGame = null;

start();

async function start() {
  renderLoading();
  try {
    const user = await server.call('session');
    await renderForUser(user);
  } catch (error) {
    renderFatalError(error.message);
  }
}

async function renderForUser(user) {
  cleanupGame?.();
  cleanupGame = null;
  if (!user) return renderAuth();
  if (!user.username) return renderUsernameSetup(user);
  await renderDashboard(user);
}

function renderAuth() {
  app.innerHTML = page(`
    <section class="auth-card" data-testid="auth-screen">
      <div class="auth-intro"><span class="brand__orb brand__orb--large"></span><p class="eyebrow">XNOVA Singleplayer</p><h1>Errichte dein Sternenimperium</h1><p>Dein lokaler Spielserver läuft sicher und dauerhaft direkt im Browser.</p>${noticeMarkup()}</div>
      <div class="auth-forms">
        <form id="register-form" class="form-card"><h2>Registrieren</h2><label>E-Mail<input data-testid="register-email" name="email" type="email" autocomplete="email" required /></label><label>Passwort<input data-testid="register-password" name="password" type="password" autocomplete="new-password" minlength="8" required /></label><button class="button button--primary" data-testid="register-submit">Account erstellen</button></form>
        <form id="login-form" class="form-card"><h2>Einloggen</h2><label>E-Mail<input data-testid="login-email" name="email" type="email" autocomplete="email" required /></label><label>Passwort<input data-testid="login-password" name="password" type="password" autocomplete="current-password" minlength="8" required /></label><button class="button button--secondary" data-testid="login-submit">Einloggen</button></form>
      </div>
    </section>
  `);
  document.querySelector('#register-form').addEventListener('submit', handleRegister);
  document.querySelector('#login-form').addEventListener('submit', handleLogin);
}

function renderUsernameSetup(user) {
  app.innerHTML = page(`<section class="form-card compact" data-testid="username-screen"><p class="eyebrow">Erster Login</p><h1>Wähle deinen Commander-Namen</h1><p>${escapeHtml(user.email)}</p>${noticeMarkup()}<form id="username-form"><label>Username<input data-testid="username-input" name="username" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" required /></label><button class="button button--primary" data-testid="username-submit">Spiel starten</button></form></section>`);
  document.querySelector('#username-form').addEventListener('submit', handleUsername);
}

async function renderDashboard(user) {
  app.innerHTML = '<div id="game-root"></div>';
  cleanupGame = await mountGameFeature({ root: document.querySelector('#game-root'), server, user, onLogout: handleLogout });
}

async function handleRegister(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  setBusy(event.currentTarget, true);
  try {
    await server.call('register', { email: values.get('email'), password: values.get('password') });
    notice = { type: 'success', text: 'Registrierung erfolgreich. Bitte logge dich jetzt ein.' };
  } catch (error) {
    notice = { type: 'danger', text: error.message };
  }
  renderAuth();
}

async function handleLogin(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  setBusy(event.currentTarget, true);
  try {
    const user = await server.call('login', { email: values.get('email'), password: values.get('password') });
    notice = null;
    await renderForUser(user);
  } catch (error) {
    notice = { type: 'danger', text: error.message };
    renderAuth();
  }
}

async function handleUsername(event) {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  setBusy(event.currentTarget, true);
  try {
    const user = await server.call('setUsername', { username: values.get('username') });
    notice = null;
    await renderDashboard(user);
  } catch (error) {
    notice = { type: 'danger', text: error.message };
    renderUsernameSetup(await server.call('session'));
  }
}

async function handleLogout() {
  await server.call('logout');
  notice = { type: 'success', text: 'Du wurdest ausgeloggt.' };
  await renderForUser(null);
}

function renderLoading() { app.innerHTML = page('<section class="loading-card">Lokaler Spielserver wird gestartet …</section>'); }
function renderFatalError(message) { app.innerHTML = page(`<section class="form-card"><h1>Start fehlgeschlagen</h1><div class="alert alert--danger">${escapeHtml(message)}</div></section>`); }
function noticeMarkup() { return notice ? `<div class="alert alert--${notice.type}" data-testid="notice">${escapeHtml(notice.text)}</div>` : ''; }
function page(content) { return `<div class="page-shell">${content}</div>`; }
function setBusy(form, busy) { for (const element of form.elements) element.disabled = busy; }
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
