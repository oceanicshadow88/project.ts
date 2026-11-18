import { Request, Response, NextFunction } from 'express';
import status from 'http-status';
import * as Role from '../model/role';
import * as Project from '../model/project';

const requireProjectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  const projectId = req.params.id;

  if (!user) return res.sendStatus(status.UNAUTHORIZED);
  if (!projectId) return res.sendStatus(status.BAD_REQUEST);

  const membership = user.projectsRoles?.find(
    ({ project }) => project?.toString() === projectId,
  );
  if (!membership?.role) return res.sendStatus(status.FORBIDDEN);

  const projectExists = await Project.getModel(req.dbConnection).exists({
    _id: projectId,
    tenant: req.tenantId,
    isDelete: false,
  });
  if (!projectExists) return res.sendStatus(status.FORBIDDEN);

  const isAdmin = await Role.getModel(req.dbConnection).exists({
    _id: membership.role,
    slug: 'admin',
    isPublic: true,
  });
  if (!isAdmin) return res.sendStatus(status.FORBIDDEN);

  return next();
};

export { requireProjectAdmin };
