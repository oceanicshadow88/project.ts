import mongoose, { Model, Schema, Types } from 'mongoose';

export interface IApiToken {
  name: string;
  tokenHash: string;
  tenant: string;
  project: Types.ObjectId;
  createdBy: Types.ObjectId;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

const apiTokenSchema = new mongoose.Schema<IApiToken>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    tenant: {
      type: String,
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'projects',
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

export const getModel = (connection: mongoose.Connection): Model<IApiToken> => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('apiTokens', apiTokenSchema);
};
