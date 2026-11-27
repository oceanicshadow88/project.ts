import { Request } from 'express';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import { hasPermission } from '../middleware/permissionMiddleware';
import * as Project from '../model/project';
import * as Role from '../model/role';

// The project, when it belongs to this tenant and isn't deleted
const findActiveProject = (req: Request, projectId: string | Types.ObjectId) =>
  Project.getModel(req.dbConnection).findOne({
    _id: projectId,
    tenant: req.tenantId,
    isDelete: false,
  });

const findProjectRole = (req: Request, projectId: string) =>
  req.user?.projectsRoles?.find((pr) => pr.project?.toString() === projectId);

const isRoleAllowed = async (req: Request, roleId: Types.ObjectId, permissionSlug: string) => {
  const role = await Role.getModel(req.dbConnection).findById(roleId);
  return role ? hasPermission(role, permissionSlug, req) : false;
};

// Improve Ticket Title: the tenant owner or any member of the project
export const getProjectAccessStatus = async (
  req: Request,
  projectId: string | Types.ObjectId,
): Promise<number> => {
  const project = await findActiveProject(req, projectId);
  if (!project) return httpStatus.NOT_FOUND;
  if (req.ownerId === req.userId) return httpStatus.OK;

  return findProjectRole(req, project.id) ? httpStatus.OK : httpStatus.FORBIDDEN;
};

// AI chat: the same rule as the frontend's checkAccess for view:tickets
export const getChatAccessStatus = async (req: Request, projectId: string): Promise<number> => {
  const project = await findActiveProject(req, projectId);
  if (!project) return httpStatus.NOT_FOUND;

  const isOwner = req.ownerId === req.userId || project.owner?.toString() === req.userId;
  if (req.user?.isSuperUser || isOwner) return httpStatus.OK;

  const projectRole = findProjectRole(req, project.id);
  if (!projectRole) return httpStatus.FORBIDDEN;

  const isAllowed = await isRoleAllowed(req, projectRole.role, 'view:tickets');
  return isAllowed ? httpStatus.OK : httpStatus.FORBIDDEN;
};
