import axios from 'axios';
import config from '../../config/config';
import { IRoleReassignment } from '../../types';

export const getRoles = async (projectId: string) => {
  const path = `${config.apiAddressV2}/projects/${projectId}/roles`;
  const response = await axios.get(path);
  return response.data;
};

export const getRoleById = async (projectId: string, roleId: string) => {
  const path = `${config.apiAddressV2}/projects/${projectId}/roles/${roleId}`;
  const response = await axios.get(path);
  return response.data;
};

export const addRole = async (projectId: string, roleName: string, permissions: Array<string>) => {
  const configHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`
    }
  };
  const path = `${config.apiAddressV2}/projects/${projectId}/roles`;
  const response = await axios.post(path, { roleName, permissions }, configHeader);
  return response.data;
};

export const updateRole = async (
  projectId: string,
  roleId: string,
  roleName: string,
  permissions: Array<string>
) => {
  const configHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`
    }
  };
  const path = `${config.apiAddressV2}/projects/${projectId}/roles/${roleId}`;
  const response = await axios.put(path, { roleName, permissions }, configHeader);
  return response.data;
};

// users who hold the role in any project
export const getRoleMembers = async (projectId: string, roleId: string) => {
  const configHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`
    }
  };
  const path = `${config.apiAddressV2}/projects/${projectId}/roles/${roleId}/members`;
  const response = await axios.get(path, configHeader);
  return response.data;
};

export const deleteRole = async (
  projectId: string,
  roleId: string,
  reassignments: IRoleReassignment[]
) => {
  const configHeader = {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}`
    }
  };
  const path = `${config.apiAddressV2}/projects/${projectId}/roles/${roleId}`;
  // axios.delete takes the request body under `data`
  const response = await axios.delete(path, { ...configHeader, data: { reassignments } });
  return response.data;
};

export const getPermissions = async () => {
  const path = `${config.apiAddressV2}/permissions`;
  const response = await axios.get(path);
  return response.data;
};
