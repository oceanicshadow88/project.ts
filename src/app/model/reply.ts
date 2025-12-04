import { Types, Schema, Document, Model } from 'mongoose';

export interface IReply {
  content: string;
  question: Types.ObjectId;
  createdBy: Types.ObjectId;
}

export type IReplyDocument = IReply & Document;

const replySchema = new Schema<IReplyDocument>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: Schema.Types.ObjectId,
      ref: 'questions',
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
    toJSON: {
      versionKey: false,
    },
  },
);

replySchema.methods.toJSON = function () {
  const reply = this;
  const replyObject = reply.toObject();
  const id = replyObject._id;
  replyObject.id = id;
  delete replyObject._id;
  delete replyObject.__v;
  return replyObject;
};

type ReplyModel = Model<IReplyDocument, {}, {}>;

export const getModel = (connection: any): ReplyModel => {
  if (!connection) {
    throw new Error('No connection');
  }
  return connection.model('replies', replySchema);
};

