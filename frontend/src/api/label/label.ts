import axios from 'axios';
import config from '../../config/config';
import { ILabelInput } from '../../types';
import { query } from '../../utils/cache';
import { alphaApiV2 } from '../../config/api';

export function getLabels(projectId: string) {
  return query('labels', () => {
    return axios.get(`${config.apiAddressV2}/labels/${projectId}`);
  });
}

export function showLabel(projectId: string) {
  return axios.get(`${config.apiAddressV2}/projects/${projectId}/labels`);
}

export function removeLabel(ticketId: string, labelId: string) {
  return axios.delete(`${config.apiAddressV2}/tickets/${ticketId}/labels/${labelId}`);
}

export function createLabel(ticketId: string, data: ILabelInput) {
  return axios.post(`${config.apiAddressV2}/tickets/${ticketId}/labels`, data);
}

export function createProjectLabel(projectId: string, data: ILabelInput) {
  return alphaApiV2.post(`/projects/${projectId}/labels`, data);
}

export function deleteLabel(id: string) {
  return axios.delete(`${config.apiAddressV2}/labels/${id}`);
}

export function updateLabel(id: string, data: ILabelInput & { color?: string }) {
  return axios.put(`${config.apiAddressV2}/labels/${id}`, data);
}
