import axios from 'axios';
import { baseURL, normalizeResponse, normalizeError } from './axiosClient';

const publicApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

publicApi.interceptors.response.use(
  (response) => normalizeResponse(response),
  (error) => Promise.reject(normalizeError(error))
);

export default publicApi;
