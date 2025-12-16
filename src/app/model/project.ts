import * as mongoose from 'mongoose';
import { Types } from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    projectLead: {
      ref: 'users',
      type: Types.ObjectId,
      required: true,
    },
    roles: [
      {
        type: Types.ObjectId,
        ref: 'roles',
      },
    ],
    owner: {
      ref: 'users',
      type: Types.ObjectId,
      required: true,
    },
    iconUrl: { type: String, required: false },
    details: { type: 'string', required: false },
    shortcut: [{ name: { type: String }, shortcutLink: { type: String } }],
    isDelete: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
    websiteUrl: {
      type: String,
      trim: true,
    },
    tenant: {
      require: true,
      type: String,
    },
    defaultRetroBoard: {
      ref: 'retroBoards',
      type: Types.ObjectId,
    },
    ticketCounter: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Pre-save middleware to validate projectLead and owner are not null
projectSchema.pre('save', function (next) {
  if (!this.projectLead) {
    const error = new Error('Project lead cannot be null or undefined');
    return next(error);
  }
  
  if (!this.owner) {
    const error = new Error('Project owner cannot be null or undefined');
    return next(error);
  }
  
  next();
});

// Pre-update middleware to validate projectLead and owner are not set to null
projectSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate() as any;
  
  // Check if projectLead is being set to null/undefined
  if (update.$set && (update.$set.projectLead === null || update.$set.projectLead === undefined)) {
    const error = new Error('Project lead cannot be set to null or undefined');
    return next(error);
  }
  
  // Check if owner is being set to null/undefined
  if (update.$set && (update.$set.owner === null || update.$set.owner === undefined)) {
    const error = new Error('Project owner cannot be set to null or undefined');
    return next(error);
  }
  
  // Check direct update without $set
  if (update.projectLead === null || update.projectLead === undefined) {
    const error = new Error('Project lead cannot be set to null or undefined');
    return next(error);
  }
  
  if (update.owner === null || update.owner === undefined) {
    const error = new Error('Project owner cannot be set to null or undefined');
    return next(error);
  }
  
  next();
});

const getModel = (connection: any) => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('projects', projectSchema);
};

export { getModel };
