import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';

type TenantScopeCheck = (dbConnection: any, id: string, tenantId: string) => Promise<void>;

// Malformed ids are passed through so each route's validator can still answer with 422.
export const scopeParamToTenant = (check: TenantScopeCheck) => {
  return async (req: Request, res: Response, next: NextFunction, id: string) => {
    if (!Types.ObjectId.isValid(id)) {
      return next();
    }
    try {
      await check(req.dbConnection, id, req.tenantId);
      next();
    } catch (e) {
      next(e);
    }
  };
};

export const requireTenantParam = (paramName: string, check: TenantScopeCheck) => {
  const scope = scopeParamToTenant(check);
  return (req: Request, res: Response, next: NextFunction) =>
    scope(req, res, next, req.params[paramName]);
};
