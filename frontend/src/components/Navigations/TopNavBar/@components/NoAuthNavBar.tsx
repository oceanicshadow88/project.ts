import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './IconTab/IconTab';
import ServicesTabs from './ServicesTabs/ServicesTabs';

function AuthNavBar() {
  return (
    <div className="mx-auto px-6 flex items-center justify-between w-80">
      <div className="flex items-center gap-1">
        <Icon />
        <ServicesTabs />
      </div>
      <div className="flex items-center gap-5">
        <Link className="no-underline text-black" to="/login">
          Login
        </Link>
        <Link className="no-underline text-black" to="/register">
          Register
        </Link>
      </div>
    </div>
  );
}

export default AuthNavBar;
