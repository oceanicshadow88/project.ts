import axios from 'axios';
import config from '../../config/config';

export interface IStatusInput {
  name?: string;
  color?: string;
}

export const getStatuses = async (projectId: string) => {
  const path = `${config.apiAddressV2}/projects/${projectId}/statuses`;
  const response = await axios.get(path);
  return response.data;
};

export function updateStatus(projectId: string, statusId: string, data: IStatusInput) {
  return axios.put(`${config.apiAddressV2}/projects/${projectId}/statuses/${statusId}`, data);
}

export function deleteStatus(projectId: string, statusId: string) {
  return axios.delete(`${config.apiAddressV2}/projects/${projectId}/statuses/${statusId}`);
}
