import axios from 'axios';
import { baseURL, normalizeResponse, normalizeError } from './axiosClient';
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../../utils/cookie';
import { authApi } from './auth.api';
import { clearClientSession } from '../../utils/authSession';

const privateApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

privateApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

privateApi.interceptors.response.use(
  (response) => normalizeResponse(response),
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return privateApi(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        clearClientSession();
        window.location.href = '/login';
        return Promise.reject(normalizeError(error));
      }

      try {
        const response = await authApi.refreshToken(refreshToken);
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        setAccessToken(accessToken);
        setRefreshToken(newRefreshToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return privateApi(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearClientSession();
        window.location.href = '/login';
        return Promise.reject(normalizeError(err));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);

export default privateApi;
