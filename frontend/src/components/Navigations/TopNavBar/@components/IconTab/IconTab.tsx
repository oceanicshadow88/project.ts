import React from 'react';
import { Link } from 'react-router-dom';
import icon from '../../../../../assets/logo.svg';

export default function iconTab() {
  return (
    <Link to="/">
      <img
        src={icon}
        alt="TeamScrumIcon"
        style={{ width: 'auto', height: '40px', marginRight: '15px' }}
      />
    </Link>
  );
}
