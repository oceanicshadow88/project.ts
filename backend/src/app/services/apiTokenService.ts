import { createHash, randomBytes } from 'node:crypto';
import { Request } from 'express';
import * as ApiToken from '../model/apiToken';
import * as User from '../model/user';
import mongoose from 'mongoose';

interface IApiTokenCreator {
  name: string;
}

interface IApiTokenWithCreator {
  createdBy: IApiTokenCreator | null;
}

const hashApiToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const authenticateApiToken = async (
  connection: mongoose.Connection,
  token: string,
): Promise<boolean> => {
  const apiTokenModel = ApiToken.getModel(connection);
  const result = await apiTokenModel.updateOne(
    { tokenHash: hashApiToken(token), revokedAt: null },
    { $currentDate: { lastUsedAt: true } },
  );
  return result.matchedCount > 0;
};

export const listApiTokens = async (req: Request) => {
  const apiTokenModel = ApiToken.getModel(req.dbConnection);
  const userModel = User.getModel(req.tenantsConnection);
  const records = await apiTokenModel
    .find({ project: req.params.id, tenant: req.tenantId })
    .select('name createdBy lastUsedAt revokedAt')
    .sort({ createdAt: -1 })
    .populate<IApiTokenWithCreator>({
    path: 'createdBy',
    model: userModel,
    select: 'name',
  });

  const tokens = records.map((record) => ({
    id: record.id,
    name: record.name || 'Unnamed token',
    createdBy: record.createdBy?.name || 'Unknown user',
    lastUsedAt: record.lastUsedAt ?? null,
    revokedAt: record.revokedAt ?? null,
  }));

  return tokens;
};

export const createApiToken = async (req: Request) => {
  const { id: projectId } = req.params;
  const { dbConnection, tenantId, userId } = req;
  const apiTokenModel = ApiToken.getModel(dbConnection);
  const token = randomBytes(32).toString('base64url');
  await apiTokenModel.create({
    name: req.body.name,
    tokenHash: hashApiToken(token),
    tenant: tenantId,
    project: projectId,
    createdBy: userId,
  });

  return { token };
};

export const revokeApiToken = async (req: Request) => {
  const apiTokenModel = ApiToken.getModel(req.dbConnection);
  const record = await apiTokenModel.findOneAndUpdate(
    { _id: req.params.tokenId, project: req.params.id, tenant: req.tenantId },
    { $set: { revokedAt: new Date() } },
    { new: true },
  );

  return record;
};
