import api from './api';

interface UploadSingleResponse {
  success: boolean;
  url: string;
}

interface UploadMultipleResponse {
  success: boolean;
  urls: string[];
}

export const uploadService = {
  async uploadSingle(file: File, folder: 'areas' | 'avatar' = 'areas'): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadSingleResponse>(`/upload?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  },

  async uploadMultiple(files: File[], folder: 'areas' | 'avatar' = 'areas'): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await api.post<UploadMultipleResponse>(`/upload?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.urls;
  },
};
