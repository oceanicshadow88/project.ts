import axios from 'axios';
import config from '../../config/config';

export function importProjects(data: FormData) {
  const url = `${config.apiAddressV2}/import-project`;
  return axios.post(url, data);
}
export function importProject(data: FormData) {
  const url = `${config.apiAddressV2}/import-project/data`;
  return axios.post(url, data);
}
