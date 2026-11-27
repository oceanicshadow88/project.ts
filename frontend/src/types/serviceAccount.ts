export interface ICreatedApiToken {
  token: string;
}

export interface IApiTokenRecord {
  id: string;
  name: string;
  createdBy: string;
  lastUsedAt: string | null;
}
