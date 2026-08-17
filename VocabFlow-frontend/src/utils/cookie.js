export const setAccessToken = (token) => {
  const expires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `accessToken=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Strict`;
};

export const getAccessToken = () => {
  const match = document.cookie.match(/(^| )accessToken=([^;]+)/);
  if (match) return decodeURIComponent(match[2]);
  return null;
};

export const setRefreshToken = (token) => {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `refreshToken=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Strict`;
};

export const getRefreshToken = () => {
  const match = document.cookie.match(/(^| )refreshToken=([^;]+)/);
  if (match) return decodeURIComponent(match[2]);
  return null;
};

export const setUser = (user) => {
  const expires = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toUTCString();
  const userData = typeof user === 'string' ? user : JSON.stringify(user);
  document.cookie = `user=${encodeURIComponent(userData)}; expires=${expires}; path=/; SameSite=Strict`;
};

export const getUser = () => {
  const match = document.cookie.match(/(^| )user=([^;]+)/);
  if (match) {
    try {
      const rawData = match[2].replace(/\+/g, '%20');
      return JSON.parse(decodeURIComponent(rawData));
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const clearTokens = () => {
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
  document.cookie = 'user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict';
};
