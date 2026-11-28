import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getApiTokens, revokeApiToken } from '../api/serviceAccount/serviceAccount';
import type { IApiTokenRecord } from '../types/serviceAccount';

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
  const revoke = async (tokenId: string) => {
    const response = await revokeApiToken(projectId, tokenId);
    if (!response) return false;
    refresh();
    return true;
  };

  return { apiTokens, refresh, revoke };
}
