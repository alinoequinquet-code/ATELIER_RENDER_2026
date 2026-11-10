// Adresse de l'API Flask (Web Service Render), fixée au build par la variable B2T_API_URL.
// Vide : l'écran de connexion demande l'adresse du serveur.
export const DEFAULT_API = (process.env.B2T_API_URL || '').trim().replace(/\/+$/, '');
