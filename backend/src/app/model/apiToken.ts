import mongoose, { Model, Schema, Types } from 'mongoose';

export interface IApiToken {
  tokenHash: string;
  tenant: string;
  project: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const apiTokenSchema = new mongoose.Schema<IApiToken>(
  {
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
  },
  { timestamps: true },
);

export const getModel = (connection: mongoose.Connection): Model<IApiToken> => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('apiTokens', apiTokenSchema);
};
