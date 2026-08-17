import privateApi from '../../../services/api/privateApi';

export const userApi = {
  getMe: () => privateApi.get('/user/me'),
  updateProfile: (data) => privateApi.put('/user', data),
  uploadAvatar: (formData) => privateApi.post('/user/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAccount: () => privateApi.delete('/user'),
  requestChangePasswordOtp: () => privateApi.post('/user/change-password-otp'),
  changePassword: (data) => privateApi.post('/user/change-password', data),
};
