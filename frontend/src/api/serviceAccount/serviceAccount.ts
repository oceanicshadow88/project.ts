import { alphaApiV2 } from '../../config/api';
import type { ICreatedApiToken } from '../../types/serviceAccount';

export const createApiToken = async (projectId: string, name: string) => {
  const response = await alphaApiV2.post<ICreatedApiToken>(`/projects/${projectId}/api-tokens`, {
    name
  });
  return response.data;
};
