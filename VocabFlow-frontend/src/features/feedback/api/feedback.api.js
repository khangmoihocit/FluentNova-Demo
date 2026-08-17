import privateApi from '../../../services/api/privateApi';

export const feedbackApi = {
  submitFeedback: (payload) => privateApi.post('/feedbacks', payload),
};
