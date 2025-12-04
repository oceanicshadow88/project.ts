import { Types, Schema, Document, Model } from 'mongoose';

export interface IQuestion {
    title: string;
    priority: string;
    assignee?: Types.ObjectId;
    isResolved: boolean;
    waitingForStakeholder: boolean;
    ticket: Types.ObjectId;
    createdBy: Types.ObjectId;
}

export type IQuestionDocument = IQuestion & Document;

const questionSchema = new Schema<IQuestionDocument>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        priority: {
            type: String,
            enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
            default: 'Medium',
        },
        assignee: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            default: null,
        },
        isResolved: {
            type: Boolean,
            default: false,
        },
        waitingForStakeholder: {
            type: Boolean,
            default: false,
        },
        ticket: {
            type: Schema.Types.ObjectId,
            ref: 'tickets',
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

questionSchema.methods.toJSON = function () {
    const question = this;
    const questionObject = question.toObject();
    const id = questionObject._id;
    questionObject.id = id;
    delete questionObject._id;
    delete questionObject.__v;
    return questionObject;
};

type QuestionModel = Model<IQuestionDocument, {}, {}>;

export const getModel = (connection: any): QuestionModel => {
    if (!connection) {
        throw new Error('No connection');
    }
    return connection.model('questions', questionSchema);
};

