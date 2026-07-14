export interface CreateReply {
  content: string;
  question: string;
}

export interface UpdateReply {
  content: string;
}

export interface IReply {
  id: string;
  content: string;
  question: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarIcon?: string;
  };
  createdAt: string;
  updatedAt: string;
}
