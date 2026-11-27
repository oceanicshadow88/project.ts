import { alphaApiV2 } from '../../config/api';
import type { IApiTokenRecord, ICreatedApiToken } from '../../types/serviceAccount';

export const getApiTokens = async (projectId: string) => {
  const response = await alphaApiV2.get<IApiTokenRecord[]>(`/projects/${projectId}/api-tokens`);
  return response.data;
};

export const createApiToken = async (projectId: string, name: string) => {
  const response = await alphaApiV2.post<ICreatedApiToken>(`/projects/${projectId}/api-tokens`, {
    name
  });
  return response.data;
};
