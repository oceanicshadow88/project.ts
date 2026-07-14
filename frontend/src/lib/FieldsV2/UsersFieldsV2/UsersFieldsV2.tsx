import React, { useEffect, useState } from 'react';
import { getUsers } from '../../../api/user/user';
import Dropdown from '../../FormV3/Dropdown/Dropdown';

interface IUsersFieldsV2 {
  onChange: (e: any) => void;
  defaultValue: string | null;
  label: string;
  name: string;
  required: boolean;
  dataTestId?: string;
}

export default function UsersFieldsV2(props: IUsersFieldsV2) {
  const { onChange, defaultValue, name, label, required, dataTestId } = props;
  const [userList, setUserList] = useState<any>([]);

  useEffect(() => {
    const getUsersList = async () => {
      if (userList.length === 0) {
        const res = await getUsers();
        setUserList(res.data);
      }
    };
    getUsersList();
  }, [userList]);

  return (
    <Dropdown
      label={label}
      onValueChanged={onChange}
      onValueBlur={() => {}}
      value={defaultValue}
      name={name}
      required={required}
      options={userList?.map((item) => {
        return {
          label: item.name,
          value: item.id
        };
      })}
      dataTestId={dataTestId}
    />
  );
}

UsersFieldsV2.defaultProps = {
  dataTestId: ''
};
