import { Request } from 'express';
import * as Permission from '../model/permission';
import * as Project from '../model/project';
import * as Role from '../model/role';
import * as User from '../model/user';
import mongoose from 'mongoose';
import { invite } from '../utils/emailSender';
import { randomStringGenerator } from '../utils/randomStringGenerator';
import jwt from 'jsonwebtoken';
import config from '../config/app';
import { createUser } from '../console/temp';

const toRoleSlug = (roleName: string) => roleName.replace('-', '').toLowerCase();

export const getProjectRole = async (req: Request) => {
  //use cache after all features moved to v2
  const roleModel = await Role.getModel(req.dbConnection);
  const tenantRoles = await roleModel.find({ tenant: req.tenantId }).populate({
    path: 'permissions',
    model: await Permission.getModel(req.dbConnection),
  });
  const roles = await roleModel.find({ isPublic: true }).populate({
    path: 'permissions',
    model: await Permission.getModel(req.dbConnection),
  });
  const rolesArr = tenantRoles ?? [];
  return [...rolesArr, ...roles];
};

export const createProjectNewRole = async (req: Request) => {
  const { roleName, permissions } = req.body;
  const roleModel = await Role.getModel(req.dbConnection);
  const role = new roleModel({
    name: roleName,
    slug: toRoleSlug(roleName),
    permissions: permissions,
    tenant: req.tenantId,
  });
  role.save();
  return role;
};

export const updateProjectRole = async (req: Request) => {
  const { roleId } = req.params;
  const { roleName, permissions } = req.body;
  const role = await Role.getModel(req.dbConnection).findById(roleId);
  if (!role) {
    return;
  }
  if (role.isPublic) {
    throw new Error('Cannot Edit Public Role');
  }
  const trimmedName = roleName?.trim();
  if (trimmedName) {
    role.name = trimmedName;
    role.slug = toRoleSlug(trimmedName);
  }
  role.permissions = permissions;
  return role.save();
};

export const updateUserProjectRole = async (req: Request) => {
  const { userId, projectId } = req.params;
  const { roleId } = req.body;
  const userModel = await User.getModel(req.tenantsConnection);
  const user = await userModel.findById(userId);

  for (const element of user.projectsRoles) {
    if (element?.project?.toString() === projectId) {
      element.role = roleId;
    }
  }
  const updateUser = await user.save();
  return updateUser;
};

// Get all users that have a specific role in a project
export const getRoleMembers = async (req: Request) => {
  // only list members of this tenant's custom roles; default roles are shared by every tenant,
  // so their ids are public and would otherwise expose users from other tenants.
  const roleModel = await Role.getModel(req.dbConnection);
  const role = await roleModel.findOne({
    _id: req.params.roleId,
    tenant: req.tenantId,
    isPublic: false,
  });
  if (!role) {
    return [];
  }
  const userModel = await User.getModel(req.tenantsConnection);
  return userModel.find({ 'projectsRoles.role': req.params.roleId }).select('name email');
};

export const deleteProjectRole = async (req: Request) => {
  const { roleId } = req.params;
  const { reassignments = [] } = req.body ?? {}; // array of objects with userId and roleId to reassign users to a new role before deleting the old one
  const roleModel = await Role.getModel(req.dbConnection);
  const role = await roleModel.findOne({ _id: roleId, tenant: req.tenantId, isPublic: false });
  if (!role) {
    return null;
  }

  // move each member to the role chosen for them before removing this one;
  // arrayFilters only changes their entries for this role, so their other projects are left alone
  const userModel = await User.getModel(req.tenantsConnection);
  await Promise.all(
    reassignments.map(({ userId, roleId: newRoleId }: { userId: string; roleId: string }) =>
      userModel.updateOne(
        { _id: userId },
        { $set: { 'projectsRoles.$[projectRole].role': newRoleId } }, // set new role
        { arrayFilters: [{ 'projectRole.role': role._id }] }, // only where old role matches this one being deleted
      ),
    ),
  );

  return roleModel.findByIdAndDelete(role._id);
};

export const removeRoleFromProject = async (req: Request) => {
  const { userId, projectId } = req.params;
  const userModel = await User.getModel(req.tenantsConnection);
  const projectModel = Project.getModel(req.dbConnection);

  // Get the project to find its tenant
  const project = await projectModel.findById(projectId);
  if (!project) {
    throw new Error('Project not found');
  }

  const user = await userModel.findById(userId);
  const updatedProjectRoles = user.projectsRoles.filter((item: any) => {
    return item.project?.toString() !== projectId;
  });
  user.projectsRoles = updatedProjectRoles;

  // Check if user has any other projects in the same tenant
  const remainingProjectIds = updatedProjectRoles.map((pr: any) => pr.project?.toString());
  if (remainingProjectIds.length > 0) {
    const otherProjectsInTenant = await projectModel.find({
      _id: { $in: remainingProjectIds },
      tenant: project.tenant,
    });

    // If user has no other projects in this tenant, remove tenant from user's tenants array
    if (otherProjectsInTenant.length === 0) {
      const tenantIdStr = project.tenant?.toString() || String(project.tenant);
      const tenantIdObj = mongoose.Types.ObjectId.isValid(tenantIdStr)
        ? new mongoose.Types.ObjectId(tenantIdStr)
        : null;
      if (tenantIdObj) {
        user.tenants = user.tenants?.filter(
          (t: any) => t?.toString() !== tenantIdObj.toString(),
        ) || [];
      }
    }
  } else {
    // User has no projects left, remove tenant
    const tenantIdStr = project.tenant?.toString() || String(project.tenant);
    const tenantIdObj = mongoose.Types.ObjectId.isValid(tenantIdStr)
      ? new mongoose.Types.ObjectId(tenantIdStr)
      : null;
    if (tenantIdObj) {
      user.tenants = user.tenants?.filter(
        (t: any) => t?.toString() !== tenantIdObj.toString(),
      ) || [];
    }
  }

  const updateUser = await user.save();
  return updateUser;
};

export const inviteUserToProject = async (req: Request) => {
  const { projectId } = req.params;
  const { roleId, email } = req.body;
  const userModel = await User.getModel(req.tenantsConnection);

  const emails = process.env.INIT_EMAIL?.split(',') ?? [];
  if (emails.length > 0) {
    for (let i = 0; i < emails?.length; i++) {
      const user = await createUser(
        req.tenantsConnection,
        emails[i],
        'techscrum',
        req.tenantId,
        emails[i].split('@')[0],
      );
      user.projectsRoles = [{ project: projectId, role: roleId }];
      await user.save();
    }

    return;
  }

  const projectModel = Project.getModel(req.dbConnection);

  const project = await projectModel.findById(projectId);

  let isUserActive = false;
  let user = await userModel.findOne({ email });
  if (!user) {
    const activeCode = randomStringGenerator(16);
    user = await new userModel({ email, activeCode, name: email.split('@')[0] });
    await user.save();
  }

  // Check if user already has this project role
  const hasProjectRole = user.projectsRoles?.some(
    (pr: any) => pr?.project?.toString() === projectId.toString(),
  );

  if (!hasProjectRole) {
    // Check if user already has this tenant
    const tenantIdStr = req.tenantId?.toString() || String(req.tenantId);
    const tenantIdObj = mongoose.Types.ObjectId.isValid(tenantIdStr)
      ? new mongoose.Types.ObjectId(tenantIdStr)
      : null;

    const hasTenant = tenantIdObj
      ? user.tenants?.some((t: any) => t?.toString() === tenantIdObj.toString())
      : false;

    const updateData: any = {
      $push: {
        projectsRoles: [{ project: projectId, role: roleId }],
      },
    };

    // Only add tenant if user doesn't already have it
    if (!hasTenant && tenantIdObj) {
      updateData.$push.tenants = tenantIdObj;
    }

    user = await userModel.findByIdAndUpdate(user._id, updateData, { new: true });
  }

  if (user.active) {
    isUserActive = true;
  }

  const accessToken = jwt.sign(
    { id: user._id, email, role: roleId, activeCode: user.activeCode },
    config.emailSecret,
  );

  const name = user.active ? user.name : '';
  invite(
    user.email,
    name,
    isUserActive,
    accessToken,
    roleId,
    project.name,
    req.headers.origin ?? '',
  );

  return { user };
};

export const getDefaultRoles = async (req: Request) => {
  const globalRoles = await Role.getModel(req.dbConnection)
    .find({ isPublic: true })
    .populate({
      path: 'permissions',
      model: Permission.getModel(req.dbConnection),
    });
  const tenantRoles = await Role.getModel(req.dbConnection)
    .find({ tenant: req.tenantId })
    .populate({
      path: 'permissions',
      model: Permission.getModel(req.dbConnection),
    });
  return [...globalRoles, ...tenantRoles];
};

export const getRoleById = async (req: Request) => {
  const { projectId, roleId } = req.params;
  //use cache after all features moved to v2
  const project = await Project.getModel(req.dbConnection)
    .findById(projectId)
    .populate({
      path: 'roles.permissions',
      model: Permission.getModel(req.dbConnection),
    });

  return project.roles.filter(
    (element: { id: { toString: () => string } }) => element?.id?.toString() === roleId,
  )[0];
};

export const getUserProjectRole = async (req: Request) => {
  const userModel = await User.getModel(req.tenantsConnection);
  const users = await userModel.find({});
  const projectMembersList = [];
  const projectId = req.params.id;
  for (const user of users) {
    const projectRoles = user.projectsRoles;
    for (const projectRole of projectRoles) {
      if (projectRole?.project?.toString() === projectId) {
        projectMembersList.push(user);
      }
    }
  }
  return projectMembersList;
};
