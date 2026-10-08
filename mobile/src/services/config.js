import * as SecureStore from 'expo-secure-store';

// Live production backend hosted on Vercel
export const DEFAULT_API_URL = 'https://ismo-backend.vercel.app/api';

const SERVER_URL_KEY = 'ismo_custom_server_url';

let activeApiUrl = DEFAULT_API_URL;

export const configService = {
  async getApiUrl() {
    try {
      const stored = await SecureStore.getItemAsync(SERVER_URL_KEY);
      // If stored value is an old local development IP, prefer the live Vercel URL
      if (stored && stored.trim().length > 0 && !stored.includes('10.3.115')) {
        activeApiUrl = stored.trim();
      } else {
        activeApiUrl = DEFAULT_API_URL;
      }
    } catch {
      activeApiUrl = DEFAULT_API_URL;
    }
    return activeApiUrl;
  },

  getCurrentApiUrl() {
    return activeApiUrl;
  },

  async setApiUrl(newUrl) {
    if (!newUrl || !newUrl.trim() || newUrl === DEFAULT_API_URL) {
      activeApiUrl = DEFAULT_API_URL;
      await SecureStore.deleteItemAsync(SERVER_URL_KEY);
      return activeApiUrl;
    }

    let formatted = newUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'https://' + formatted;
    }
    if (!formatted.endsWith('/api')) {
      formatted = formatted.replace(/\/+$/, '') + '/api';
    }

    activeApiUrl = formatted;
    await SecureStore.setItemAsync(SERVER_URL_KEY, formatted);
    return activeApiUrl;
  },
};
