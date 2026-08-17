import { getAccessToken } from './cookie';

export const isAuthenticated = () => {
  return !!getAccessToken();
};
