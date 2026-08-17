import privateApi from '@/services/api/privateApi';
import publicApi from './publicApi';

export const dictionaryApi = {
  lookupBasic: (word) => {
    return privateApi.get('/vocabularies/lookup/basic', { params: { word } });
  },
  lookupAI: (data) => {
    return privateApi.post('/vocabularies/lookup/ai', data);
  },
  translate: (data) => {
    return privateApi.post('/vocabularies/translate', data);
  }
};
