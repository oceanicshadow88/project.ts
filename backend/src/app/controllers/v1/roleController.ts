import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/helper';
import status from 'http-status';
import { validationResult } from 'express-validator';
import { replaceId } from '../../services/replaceService';
import {
  createProjectNewRole,
  deleteProjectRole,
  getDefaultRoles,
  getProjectRole,
  getRoleById,
  getRoleMembers,
  updateProjectRole,
} from '../../services/roleService';

export const index = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }

  const rolesArr = await getProjectRole(req);
  res.send(replaceId(rolesArr));
};

export const roleById = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }

  const rolesArr = getRoleById(req);
  res.send(replaceId(rolesArr));
};

export const addNewRole = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.sendStatus(status.UNPROCESSABLE_ENTITY);
  }

  const result = await createProjectNewRole(req);
  res.status(status.OK).send(result);
});

export const update = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const updatedProject = await updateProjectRole(req);
  res.send(replaceId(updatedProject));
};

export const members = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const roleMembers = await getRoleMembers(req);
  // replaceId turns _id into id, which the frontend expects
  res.send(replaceId(roleMembers));
});

export const destroy = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  // every member of the role must be given a different role before it can be deleted
  const { reassignments = [] } = req.body ?? {};
  // check against who holds the role now, not the list the browser showed
  const roleMembers = await getRoleMembers(req);
  const isEveryMemberReassigned = roleMembers.every((member: { id: string }) =>
    reassignments.some(
      (reassignment: { userId: string; roleId: string }) =>
        reassignment.userId === member.id &&
        reassignment.roleId &&
        reassignment.roleId !== req.params.roleId,
    ),
  );
  // stop before anything changes
  if (!isEveryMemberReassigned) {
    return res.sendStatus(status.BAD_REQUEST);
  }
  const updateProject = await deleteProjectRole(req);
  res.send(replaceId(updateProject));
});

export const defaultRoles = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(status.UNPROCESSABLE_ENTITY).json({});
  }
  const roles = await getDefaultRoles(req);
  return res.status(status.OK).json(replaceId(roles));
};
