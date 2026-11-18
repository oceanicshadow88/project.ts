import { createHash, randomBytes } from 'crypto';
import { Request } from 'express';
import * as ApiToken from '../model/apiToken';
import mongoose from 'mongoose';

const hashApiToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const authenticateApiToken = async (
  connection: mongoose.Connection,
  token: string,
): Promise<boolean> => {
  const apiTokenModel = ApiToken.getModel(connection);
  const record = await apiTokenModel.exists({
    tokenHash: hashApiToken(token),
  });
  return record !== null;
};

export const createApiToken = async (req: Request) => {
  const { id: projectId } = req.params;
  const { dbConnection, tenantId, userId } = req;
  const apiTokenModel = ApiToken.getModel(dbConnection);
  const token = randomBytes(32).toString('base64url');
  await apiTokenModel.create({
    tokenHash: hashApiToken(token),
    tenant: tenantId,
    project: projectId,
    createdBy: userId,
  });

  return { token };
};
