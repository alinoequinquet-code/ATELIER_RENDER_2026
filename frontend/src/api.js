// Accès à l'API Flask (Web Service Render)
export const DEFAULT_API = (process.env.B2T_API_URL || '').replace(/\/+$/, '');
const KEY = 'b2t.cloud';

export function loadSettings() {
  try {
    return { url: DEFAULT_API, code: '', ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (e) {
    return { url: DEFAULT_API, code: '' };
  }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* stockage indisponible */ }
}

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// Le plan gratuit endort le serveur : le premier appel peut prendre près d'une minute
export async function api(settings, path, { method = 'GET', body } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 75000);
  let res;
  try {
    res = await fetch(settings.url.replace(/\/+$/, '') + path, {
      method,
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${settings.code}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'Le serveur ne répond pas.' : 'Serveur injoignable.', 0);
  } finally {
    clearTimeout(timer);
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* réponse vide */ }
  if (!res.ok) throw new ApiError((data && data.error) || `Erreur ${res.status}`, res.status);
  return data;
}

export function errorText(e) {
  if (e.status === 401) return 'Code d’accès incorrect.';
  if (e.status === 503) return 'Le serveur n’est pas prêt (base de données ou code d’accès non configurés).';
  if (e.status === 0) return 'Serveur injoignable. Vérifie la connexion, puis réessaie : sur le plan gratuit, le serveur peut mettre une minute à se réveiller.';
  return e.message || 'Erreur inattendue.';
}
