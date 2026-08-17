import pythonApi from '../../../services/api/pythonApi';

export const translationDocxApi = {
  /**
   * Parse a .docx file into a list of sentences (one sentence per line/paragraph).
   * Processed entirely in-memory on the Python service; nothing is stored on the server.
   * @param {File} file
   * @returns {{ sentences: string[], count: number }}
   */
  parseDocx: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return pythonApi.post('/api/translation/parse-docx', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
