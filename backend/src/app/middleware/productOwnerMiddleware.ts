import { Response, Request, NextFunction } from 'express';
import * as Role from '../model/role';
import * as Project from '../model/project';
import status from 'http-status';

const checkIsOwner = async (projectId: string, userId: string, req: Request) => {
  const project = await Project.getModel(req.dbConnection).findById(projectId);
  if (!project) return false;
  return project.owner.toString() === userId;
};

// Unused function - kept for potential future use
// const getProjectRoleId = (projectId: string, projectsRoles: IProjectRole[]) => {
//   let roleId = null;
//   projectsRoles.forEach((element: { project: { toString: () => string }; role: any }) => {
//     if (element.project.toString() === projectId.toString()) {
//       roleId = element.role;
//     }
//   });
//   return roleId;
// };

export const requireProductOwner = async (req: Request, res: Response, next: NextFunction) => {
  const user: any = req.user;
  const projectId = req.params.projectId;

  if (!user) {
    return res.status(status.UNAUTHORIZED).send('User not authenticated');
  }

  if (!projectId) {
    return res.status(status.BAD_REQUEST).send('Project ID is required');
  }

  // Super users and project owners can access
  if (user.isSuperUser || (await checkIsOwner(projectId, user.id, req))) {
    return next();
  }

  // Populate projectsRoles.role if not already populated
  if (user.projectsRoles && user.projectsRoles.length > 0) {
    const firstRole = user.projectsRoles[0].role;
    if (firstRole && typeof firstRole === 'object' && !('name' in firstRole)) {
      // Roles are not populated, populate them
      const roleModel = Role.getModel(req.dbConnection);
      await user.populate({
        path: 'projectsRoles.role',
        model: roleModel,
        select: 'name slug',
      });
    }
  }

  // Check if user has Product Owner role for this project
  const projectsRoles = user.projectsRoles || [];
  const projectRole = projectsRoles.find((pr: any) => {
    const projectIdStr = typeof pr.project === 'object' ? pr.project.toString() : pr.project;
    return projectIdStr === projectId;
  });

  if (!projectRole) {
    return res.status(status.FORBIDDEN).send('User does not have access to this project');
  }

  const role = projectRole.role;
  if (!role) {
    return res.status(status.FORBIDDEN).send('Role not found');
  }

  // Check if role is Product Owner (role should be populated object with name/slug)
  const roleName = typeof role === 'object' && role !== null ? role.name : null;
  const roleSlug = typeof role === 'object' && role !== null ? role.slug : null;

  if (roleName === 'Product Owner' || roleSlug === 'product-owner') {
    return next();
  }

  return res.status(status.FORBIDDEN).send('User must have Product Owner role to access this page');
};

