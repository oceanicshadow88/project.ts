import { Request, Response, NextFunction } from 'express';
import status from 'http-status';
import { PUBLIC_DB, tenantDBConnection } from '../database/connections';
import { authenticateApiToken } from '../services/apiTokenService';
import { asyncHandler } from '../utils/helper';

const getBearerToken = (req: Request) => /^Bearer +(\S+)$/i.exec(req.get('authorization') ?? '')?.[1];

export const mcpAuthMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    res.setHeader('WWW-Authenticate', 'Bearer');
    return res.sendStatus(status.UNAUTHORIZED);
  }

  const dbConnection = await tenantDBConnection(PUBLIC_DB);
  const isAuthenticated = await authenticateApiToken(dbConnection, token);
  if (!isAuthenticated) {
    res.setHeader('WWW-Authenticate', 'Bearer error="invalid_token"');
    return res.sendStatus(status.UNAUTHORIZED);
  }

  return next();
});
