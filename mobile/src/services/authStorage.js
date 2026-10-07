import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'ismo_jwt_token';
const USER_KEY = 'ismo_current_user_data';

export const authStorage = {
  async saveToken(token) {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (e) {
      console.warn('Failed to save token to SecureStore:', e);
    }
  },

  async getToken() {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to get token from SecureStore:', e);
      return null;
    }
  },

  async removeToken() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (e) {
      console.warn('Failed to delete token from SecureStore:', e);
    }
  },

  async saveUser(user) {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user to SecureStore:', e);
    }
  },

  async getUser() {
    try {
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Failed to get user from SecureStore:', e);
      return null;
    }
  },

  async clearAll() {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (e) {
      console.warn('Failed to clear SecureStore:', e);
    }
  },
};

