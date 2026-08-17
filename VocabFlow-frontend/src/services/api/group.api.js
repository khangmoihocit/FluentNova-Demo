import privateApi from './privateApi';

export const groupApi = {
  getGroups: () => privateApi.get('/groups'),
  createGroup: (data) => privateApi.post('/groups', data),
  renameGroup: (id, data) => privateApi.put(`/groups/${id}`, data),
  deleteGroup: (id) => privateApi.delete(`/groups/${id}`),
};
