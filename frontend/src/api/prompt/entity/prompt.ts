export interface CreatePrompt {
  title: string;
  prompt: string;
}

export interface UpdatePrompt {
  title?: string;
  prompt?: string;
}

export interface IPrompt {
  id: string;
  title: string;
  prompt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarIcon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PromptsListResponse {
  data: IPrompt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
