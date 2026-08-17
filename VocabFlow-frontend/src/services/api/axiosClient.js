export const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8085/api/v1';
export const baseSite = import.meta.env.VITE_API_SITE || 'http://localhost:8085/api/v1';

export const normalizeResponse = (response) => {
  return {
    success: response.data?.success ?? true,
    data: response.data?.data || response.data,
    message: response.data?.message || 'Success',
    code: response.data?.code || '',
    timestamp: response.data?.timestamp || '',
  };
};

export const normalizeError = (error) => {
  if (error.response) {
    return {
      message: error.response.data?.message || 'Unauthorized or server error',
      status: error.response.status,
      code: error.response.data?.code || '',
      success: error.response.data?.success || false,
      timestamp: error.response.data?.timestamp || '',
      errors: error.response.data?.errors || null,
    };
  } else if (error.request) {
    return {
      message: 'Network error or no response from server',
      status: 0,
    };
  } else {
    return {
      message: error.message,
      status: 0,
      code: error.code,
      success: false,
      timestamp: '',
    };
  }
};
