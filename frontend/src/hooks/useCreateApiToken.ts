import { useState } from 'react';
import { toast } from 'react-toastify';
import { createApiToken } from '../api/serviceAccount/serviceAccount';
import type { ICreatedApiToken } from '../types/serviceAccount';

export default function useCreateApiToken(projectId: string) {
  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<ICreatedApiToken | null>(null);

  const create = async (name: string) => {
    if (loading || !projectId) return;
    setLoading(true);
    try {
      const token = await createApiToken(projectId, name);
      toast.success('API token created', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
      setCreatedToken(token);
    } catch {
      toast.error('Unable to create an API token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, createdToken };
}
