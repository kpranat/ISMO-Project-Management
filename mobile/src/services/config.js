import * as SecureStore from 'expo-secure-store';

// Default to the computer's current local Wi-Fi IP address
export const DEFAULT_API_URL = 'http://10.3.115.194:5000/api';

const SERVER_URL_KEY = 'ismo_custom_server_url';

let activeApiUrl = DEFAULT_API_URL;

export const configService = {
  async getApiUrl() {
    try {
      const stored = await SecureStore.getItemAsync(SERVER_URL_KEY);
      if (stored && stored.trim().length > 0) {
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
    if (!newUrl || !newUrl.trim()) {
      activeApiUrl = DEFAULT_API_URL;
      await SecureStore.deleteItemAsync(SERVER_URL_KEY);
      return activeApiUrl;
    }

    let formatted = newUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = 'http://' + formatted;
    }
    if (!formatted.endsWith('/api')) {
      formatted = formatted.replace(/\/+$/, '') + '/api';
    }

    activeApiUrl = formatted;
    await SecureStore.setItemAsync(SERVER_URL_KEY, formatted);
    return activeApiUrl;
  },
};

