import publicApi from './publicApi';

export const authApi = {
  login: (data) => publicApi.post('/auth/login', data),
  register: (data) => publicApi.post('/auth/register', data),
  verifyRegister: (data) => publicApi.post('/auth/verify-register', data),
  resendRegisterOtp: (email) => publicApi.post('/auth/resend-register-otp', { email }),
  forgotPassword: (email) => publicApi.post('/auth/forgot-password', { email }),
  resetPassword: (data) => publicApi.post('/auth/reset-password', data),
  refreshToken: (refreshToken) => publicApi.post('/auth/refresh-token', { refreshToken }),
  logout: (refreshToken) => publicApi.post('/auth/logout', { refreshToken }),
  recoverAccount: (email) => publicApi.post('/auth/recover-account', { email }),
  renewAccount: (email) => publicApi.post('/auth/re-new-account', { email }),
  googleLogin: (token) => publicApi.post('/auth/google-login', { token })
};
