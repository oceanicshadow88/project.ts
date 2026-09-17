import { Request, Response, NextFunction } from 'express';
import { getPermissions } from '../../services/permissionService'; 
import status from 'http-status';
import { validationResult } from 'express-validator';
import { replaceId } from '../../services/replaceService';

//get
export const index = async (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }
  try {
    //use cache after all features move to v2
    const permissions = await getPermissions(req);
    res.send(replaceId(permissions));
  } catch (e) {
    next(e);
  }
};
