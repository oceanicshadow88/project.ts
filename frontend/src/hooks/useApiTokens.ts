import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { createApiToken, getApiTokens, revokeApiToken } from '../api/serviceAccount/serviceAccount';
import type { IApiTokenRecord, ICreatedApiToken } from '../types/serviceAccount';

export default function useApiTokens(projectId: string) {
  const [apiTokens, setApiTokens] = useState<IApiTokenRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setApiTokens([]);

    const fetchApiTokens = async () => {
      try {
        const records = await getApiTokens(projectId);
        if (active) setApiTokens(records);
      } catch {
        if (active) toast.error('Unable to load API tokens. Please try again.');
      }
    };

    if (projectId) fetchApiTokens();
    return () => {
      active = false;
    };
  }, [projectId, refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const create = async (name: string): Promise<ICreatedApiToken | null> => {
    if (!projectId) return null;
    try {
      const token = await createApiToken(projectId, name);
      refresh();
      toast.success('API token created', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
      return token;
    } catch {
      toast.error('Unable to create an API token. Please try again.');
      return null;
    }
  };

  const revoke = async (tokenId: string) => {
    try {
      const response = await revokeApiToken(projectId, tokenId);
      if (!response) return false;
      refresh();
      toast.success('API token revoked', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
      return true;
    } catch {
      toast.error('Unable to revoke the API token. Please try again.');
      return false;
    }
  };

  return { apiTokens, create, revoke };
}
