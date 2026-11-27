import { Request } from 'express';
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import * as Project from '../model/project';

// OK when the project belongs to this tenant and the user is the owner or a member
export const getProjectAccessStatus = async (
  req: Request,
  projectId: string | Types.ObjectId,
): Promise<number> => {
  const project = await Project.getModel(req.dbConnection).findOne({
    _id: projectId,
    tenant: req.tenantId,
    isDelete: false,
  });
  if (!project) return httpStatus.NOT_FOUND;
  if (req.ownerId === req.userId) return httpStatus.OK;

  const accessibleProjectIds =
    req.user?.projectsRoles?.filter((pr) => pr.project).map((pr) => pr.project.toString()) ?? [];
  return accessibleProjectIds.includes(project.id) ? httpStatus.OK : httpStatus.FORBIDDEN;
};
