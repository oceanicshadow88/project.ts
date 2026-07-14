import mongoose, { Schema, Types } from 'mongoose';

export interface IReviewReport {
  ticket: Types.ObjectId;
  assignee: Types.ObjectId;
  project: Types.ObjectId;
  dueDate: Date;
  submittedAt?: Date;
  submittedBy?: Types.ObjectId;
  reportContent?: string;
  status: 'pending' | 'submitted' | 'overdue';
  emailSentAt?: Date;
  warningEmailSentAt?: Date;
  accessRemovedAt?: Date;
  notes?: string;
}

export type IReviewReportDocument = IReviewReport & mongoose.Document;

const reviewReportSchema = new Schema<IReviewReportDocument>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'tickets',
      required: true,
      index: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'projects',
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      default: null,
    },
    reportContent: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'overdue'],
      default: 'pending',
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    warningEmailSentAt: {
      type: Date,
      default: null,
    },
    accessRemovedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Compound index for efficient queries
reviewReportSchema.index({ status: 1, dueDate: 1 });
reviewReportSchema.index({ assignee: 1, project: 1 });

reviewReportSchema.methods.toJSON = function () {
  const reportObject = this.toObject();
  const id = reportObject._id;
  reportObject.id = id;
  delete reportObject._id;
  delete reportObject.__v;
  return reportObject;
};

export const getModel = (connection: any) => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('reviewReports', reviewReportSchema);
};
