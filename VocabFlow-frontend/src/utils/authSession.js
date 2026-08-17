import { queryClient } from '../lib/queryClient';
import { authApi } from '../services/api/auth.api';
import {
  clearTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setUser,
} from './cookie';

const LOGOUT_EVENT_KEY = 'vocabflow:auth:logout';
const LOGOUT_TIMEOUT_MS = 3000;

const withTimeout = (promise, timeoutMs = LOGOUT_TIMEOUT_MS) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Logout request timed out')), timeoutMs);
    }),
  ]);
};

export const clearClientSession = ({ broadcast = true } = {}) => {
  clearTokens();
  queryClient.clear();

  if (broadcast) {
    try {
      window.localStorage.setItem(LOGOUT_EVENT_KEY, String(Date.now()));
    } catch (error) {
      console.warn('Unable to broadcast logout event', error);
    }
  }
};

export const setAuthenticatedSession = ({ accessToken, refreshToken, user }) => {
  queryClient.clear();

  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
  if (user) setUser(user);
};

export const logoutClientSession = ({ redirectTo = '/' } = {}) => {
  const refreshToken = getRefreshToken();

  try {
    clearClientSession();
  } catch (error) {
    console.error('Client session cleanup failed; clearing auth cookies directly:', error);
    clearTokens();
  }

  if (refreshToken) {
    withTimeout(authApi.logout(refreshToken)).catch((error) => {
      console.error('Backend logout failed after client session cleanup:', error);
    });
  }

  window.location.replace(redirectTo);
};

export const installAuthSessionSync = () => {
  if (window.__VOCABFLOW_AUTH_SYNC_INSTALLED__) {
    return () => {};
  }

  window.__VOCABFLOW_AUTH_SYNC_INSTALLED__ = true;

  const handleStorage = (event) => {
    if (event.key === LOGOUT_EVENT_KEY) {
      clearClientSession({ broadcast: false });
      window.location.assign('/login');
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
  };
};
