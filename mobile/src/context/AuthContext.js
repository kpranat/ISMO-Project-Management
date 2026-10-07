import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from '../services/authStorage.js';
import { authService, setTokenExpiredHandler } from '../services/api.js';
import { configService } from '../services/config.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverUrl, setServerUrl] = useState(configService.getCurrentApiUrl());

  useEffect(() => {
    const init = async () => {
      try {
        const activeUrl = await configService.getApiUrl();
        setServerUrl(activeUrl);

        const token = await authStorage.getToken();
        if (token) {
          const cachedUser = await authStorage.getUser();
          if (cachedUser) {
            setUser(cachedUser);
          }
          // Verify with server in background
          try {
            const freshUser = await authService.getCurrentUser();
            setUser(freshUser);
          } catch (e) {
            // If server rejects token as invalid or expired
            if (e.response?.status === 401) {
              await authStorage.clearAll();
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.warn('Auth init failed:', err);
      } finally {
        setLoading(false);
      }
    };

    setTokenExpiredHandler(() => {
      setUser(null);
    });

    init();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateServerUrl = async (newUrl) => {
    const updated = await configService.setApiUrl(newUrl);
    setServerUrl(updated);
    return updated;
  };

  const refreshUser = async () => {
    try {
      const fresh = await authService.getCurrentUser();
      setUser(fresh);
      return fresh;
    } catch {
      return user;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        serverUrl,
        login,
        register,
        logout,
        updateServerUrl,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

