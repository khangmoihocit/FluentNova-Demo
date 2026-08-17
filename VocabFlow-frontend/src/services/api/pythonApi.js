import axios from 'axios';

const PYTHON_BASE_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';
const PYTHON_API_KEY = import.meta.env.VITE_PYTHON_API_KEY || 'vocabflow-secret-key-12345';

const pythonApi = axios.create({
  baseURL: PYTHON_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': PYTHON_API_KEY,
  },
});

pythonApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'Python service error';
    return Promise.reject({ message, status: error.response?.status || 0 });
  }
);

export default pythonApi;
