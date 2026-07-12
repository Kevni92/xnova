export const RESOURCE_META = Object.freeze({
  metal: { label: 'Metall', icon: 'M' },
  crystal: { label: 'Kristall', icon: 'K' },
  deuterium: { label: 'Deuterium', icon: 'D' },
});

const RESOURCE_REFERENCE_META = Object.freeze({
  ...RESOURCE_META,
  energy: { label: 'Energie', icon: 'E' },
});

export function formatNumber(value) {
  return new Intl.NumberFormat('de-DE').format(Math.floor(Number(value) || 0));
}

export function formatPercent(value) {
  return `${Math.round(value)} %`;
}

export function signed(value) {
  const number = Math.floor(Number(value) || 0);
  return `${number >= 0 ? '+' : ''}${formatNumber(number)}`;
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function planetTone(type) {
  if (type === 'Eiswelt') return 'ice';
  if (type === 'Vulkanwelt') return 'volcanic';
  if (type === 'Wüstenwelt') return 'desert';
  if (type === 'Ozeanwelt') return 'ocean';
  return 'terran';
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function resourceIconMarkup(key) {
  const meta = RESOURCE_REFERENCE_META[key];
  if (!meta) {
    return '';
  }

  return `<span class="resource-icon resource-icon--${key}" aria-label="${meta.label}" title="${meta.label}">${meta.icon}</span>`;
}

export function resourceTextMarkup(value) {
  let markup = escapeHtml(value);

  for (const [key, meta] of Object.entries(RESOURCE_REFERENCE_META)) {
    markup = markup.replace(new RegExp(`\\b${meta.label}\\b`, 'g'), resourceIconMarkup(key));
  }

  return markup;
}

export function costMarkup(costs) {
  return Object.entries(RESOURCE_META)
    .filter(([key]) => Number(costs[key]) > 0)
    .map(([key]) => `<span class="cost cost--${key}">${resourceIconMarkup(key)}<span>${formatNumber(costs[key])}</span></span>`)
    .join('') || '<span class="cost">Kostenlos</span>';
}

export function resourceMarkup(key, meta, planet) {
  return `<div class="resource-item" data-testid="resource-${key}"><span class="resource-item__icon resource-item__icon--${key}">${meta.icon}</span><span><small>${meta.label}</small><strong>${formatNumber(planet.resources[key])}</strong></span><em class="resource-item__delta">+${formatNumber(planet.production[key])}/h</em></div>`;
}

export function navButton(key, label, icon, active) {
  const selected = active === key;
  return `<button class="main-menu__item${selected ? ' is-active' : ''}" data-view="${key}" data-testid="nav-${key}" aria-pressed="${selected}"><span class="main-menu__icon" aria-hidden="true">${icon}</span><span>${label}</span></button>`;
}
