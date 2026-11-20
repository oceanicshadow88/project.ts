import { Request, Response, NextFunction } from 'express';
import status from 'http-status';
import * as Role from '../model/role';
import * as Project from '../model/project';

const requireProjectAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  const projectId = req.params.id;

  if (!user || !req.userId) return res.sendStatus(status.UNAUTHORIZED);
  if (!projectId) return res.sendStatus(status.BAD_REQUEST);

  const project = await Project.getModel(req.dbConnection).findOne({
    _id: projectId,
    tenant: req.tenantId,
    isDelete: false,
  });
  if (!project) return res.sendStatus(status.FORBIDDEN);

  const isOwner = project.owner?.toString() === req.userId;
  if (user.isSuperUser || isOwner) return next();
  
  const currentProjectRole = user.projectsRoles?.find(
    (item) => item.project?.toString() === projectId,
  );
  if (!currentProjectRole?.role) return res.sendStatus(status.FORBIDDEN);

  const isAdmin = await Role.getModel(req.dbConnection).exists({
    _id: currentProjectRole.role,
    slug: 'admin',
    isPublic: true,
  });
  if (!isAdmin) return res.sendStatus(status.FORBIDDEN);

  return next();
};

export { requireProjectAdmin };
