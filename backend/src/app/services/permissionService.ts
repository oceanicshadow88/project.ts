import { Request } from 'express';
import * as Permission from '../model/permission';

export const getPermissions = async (req: Request) => {
  //use cache after all features move to v2
  return Permission.getModel(req.dbConnection).find();
};