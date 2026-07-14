import { IReply } from '../../reply/entity/reply';

export interface CreateQuestion {
  title: string;
  priority?: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  assignee?: string | 'automatic';
  ticket: string;
}

export interface UpdateQuestion {
  title?: string;
  priority?: 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';
  assignee?: string | null;
  isResolved?: boolean;
  waitingForStakeholder?: boolean;
}

export interface IQuestion {
  id: string;
  title: string;
  priority: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatarIcon?: string;
  } | null;
  isResolved: boolean;
  waitingForStakeholder: boolean;
  ticket:
    | string
    | {
        id: string;
        title: string;
        sprint?: {
          id: string;
          name: string;
          status?: 'active' | 'planning' | 'completed';
        } | null;
      };
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarIcon?: string;
  };
  createdAt: string;
  updatedAt: string;
  replies?: IReply[]; // Optional: included when fetching questions with replies
  isClear?: boolean;
  messages?: string[];
}
