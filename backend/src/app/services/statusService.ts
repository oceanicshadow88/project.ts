import { Request } from 'express';
import * as Status from '../model/status';
import { Types } from 'mongoose';

export const getAllStatus = (req: Request) => {
  const { tenantId } = req;
  return Status.getModel(req.dbConnection).find(
    { tenant: new Types.ObjectId(tenantId) },
    { createdAt: 0, updatedAt: 0 },
    { sort: { order: 1 } },
  );
};

export const updateStatus = async (req: Request) => {
  const { id } = req.params;
  const { tenantId } = req;
  const statusModel = Status.getModel(req.dbConnection);

  // Find status and verify it belongs to the tenant
  const status = await statusModel.findOne({
    _id: id,
    tenant: new Types.ObjectId(tenantId),
  });

  if (!status) {
    throw new Error('Status not found or does not belong to this tenant');
  }

  // Update only allowed fields (excluding tenant which should never change)
  const allowedFields = ['name', 'slug', 'isDefault', 'color'];
  const updateData: any = {};
  
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedStatus = await statusModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!updatedStatus) {
    throw new Error('Failed to update status');
  }

  return updatedStatus;
};