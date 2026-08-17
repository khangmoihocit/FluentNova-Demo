import publicApi from '@/services/api/publicApi';

export const dictionaryLookupApi = {
  /** Lookup a word in the dictionary — no auth needed */
  lookup: (word) =>
    publicApi.get('/vocabularies/lookup', { params: { word } }),
};
