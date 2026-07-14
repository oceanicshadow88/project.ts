/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import decode from 'jwt-decode';
import { IUserInfo } from '../types';
import { getUserInfo } from '../api/userProfile/userProfile';
import { projectRolesToObject, setUserPermissionsLocalStorage } from '../utils/helpers';
import { isOwner } from '../api/tenant/tenant';

const UserContext = createContext<IUserInfo>({});
const UserDispatchContext = createContext<Dispatch<SetStateAction<IUserInfo>>>(() => {});

interface ILoginInfoProvider {
  children?: React.ReactNode;
}

const getExpirtationDate = (token: string) => {
  const decodeJSON: any = decode(token);
  const expirationDate = new Date();
  const ts = new Date().getTime();
  expirationDate.setTime(ts + decodeJSON.exp / 10);
  return expirationDate;
};

function UserProvider({ children }: ILoginInfoProvider) {
  const [userInfo, setUserInfo] = useState<IUserInfo>({});
  const navigator = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async (token: string, refreshToken: string) => {
      try {
        const result = await getUserInfo(token, refreshToken);
        const { user } = result.data;
        const userId = user.id as string;

        // Try to get owner status, but don't fail if it errors
        let isUserOwner = false;
        try {
          const ownerResult = await isOwner(userId);
          isUserOwner = ownerResult?.data || false;
        } catch (ownerError) {
          // If isOwner fails, continue without owner status
          // eslint-disable-next-line no-console
          console.warn('Failed to check owner status:', ownerError);
        }

        const t = token ?? user.token;
        const projectRoles = JSON.stringify(projectRolesToObject(user.projectsRoles || []));
        // Preserve projectsRoles array from user object (needed for authorization checks)
        // Make sure projectsRoles is explicitly set as an array with populated roles
        const userProjectsRoles = Array.isArray(user.projectsRoles) ? user.projectsRoles : [];

        // eslint-disable-next-line no-console
        console.log('UserInfoProvider setting user:', {
          userId: user.id,
          projectsRolesCount: userProjectsRoles.length,
          projectsRoles: userProjectsRoles
        });

        setUserInfo({
          ...user,
          token: t,
          projectRoles,
          projectsRoles: userProjectsRoles, // Keep original array format with populated roles
          isCurrentUserOwner: isUserOwner
        });
        setUserPermissionsLocalStorage(user);
        localStorage.setItem('expiration_date', getExpirtationDate(t).toString());
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user info:', e);
        localStorage.clear();
        setUserInfo({});
        navigator('/login');
      }
    };

    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const expirationDate = new Date(localStorage.getItem('expiration_date') ?? '');
    if (expirationDate <= new Date()) {
      localStorage.clear();
      setUserInfo({});
      navigator('/login');
    }
    if (
      token !== undefined &&
      token != null &&
      refreshToken !== undefined &&
      refreshToken !== null
    ) {
      fetchUserInfo(token, refreshToken);
    }
  }, [localStorage.getItem('access_token'), localStorage.getItem('refresh_token')]);

  return (
    <UserContext.Provider value={userInfo}>
      <UserDispatchContext.Provider value={setUserInfo}>{children}</UserDispatchContext.Provider>
    </UserContext.Provider>
  );
}

UserProvider.defaultProps = {
  children: null
};

export { UserDispatchContext, UserContext, UserProvider };
