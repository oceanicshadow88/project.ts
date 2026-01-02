import { Schema, Document, Model, Types } from 'mongoose';

export interface IPrompt {
  title: string;
  prompt: string;
  tenant: string;
  createdBy: Types.ObjectId;
}

export type IPromptDocument = IPrompt & Document;

const promptSchema = new Schema<IPromptDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10000,
    },
    tenant: {
      type: String,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Add index for better search performance
promptSchema.index({ title: 'text', prompt: 'text' });

type PromptModel = Model<IPromptDocument, {}, {}>;

export const getModel = (connection: any): PromptModel => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('prompts', promptSchema);
};
