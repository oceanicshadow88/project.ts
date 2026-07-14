import mongoose, { Schema, Types } from 'mongoose';

export type SprintStatus = 'active' | 'planning' | 'completed';

export interface ISprint {
  name: string;
  startDate?: Date;
  endDate?: Date | null;
  description?: string;
  status?: SprintStatus;
  project?: Types.ObjectId;
  sprintGoal?: string;
  board?: Types.ObjectId;
  retroBoard?: Types.ObjectId;
}

export type ISprintDocument = ISprint & mongoose.Document;

const sprintSchema = new Schema<ISprintDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'planning', 'completed'],
      default: 'planning',
    },
    project: {
      ref: 'projects',
      type: Types.ObjectId,
    },
    sprintGoal: {
      type: String,
    },
    board: {
      ref: 'boards',
      type: Types.ObjectId,
    },
    retroBoard: {
      ref: 'retroBoards',
      type: Types.ObjectId,
    },
  },
  { timestamps: true },
);

sprintSchema.statics.findLatestSprints = async function (projectId: string) {
  const result = await this.find({ project: projectId, status: 'active' });
  return result;
};

export const getModel = (connection: any) => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('sprints', sprintSchema);
};
