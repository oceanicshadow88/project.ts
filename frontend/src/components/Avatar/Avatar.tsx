import React from 'react';
import styles from './Avatar.module.scss';
import InitialAvatar from '../InitialAvatar/InitialAvatar';
import userAvatar from '../../assets/userAvatar.png';

interface AvatarProps {
  avatarIcon?: string;
  backgroundColor?: string;
  name?: string;
  unassignedAvatar?: string;
  selected?: boolean;
  size?: number;
  className?: string;
}

function Avatar({
  avatarIcon,
  backgroundColor = '',
  name = 'Unassigned',
  unassignedAvatar = userAvatar,
  selected = false,
  size = 25,
  className
}: AvatarProps) {
  if (avatarIcon || name === 'Unassigned') {
    return (
      <img
        style={{ width: size, height: size }}
        className={`${selected ? styles.backlogUserIconWithBorder : styles.backlogUserIcon}${
          className ? ` ${className}` : ''
        }`}
        src={avatarIcon || unassignedAvatar}
        alt={name}
      />
    );
  }

  return (
    <InitialAvatar
      name={name}
      backgroundColor={backgroundColor}
      size={size}
      selected={selected}
      className={className}
    />
  );
}

export default Avatar;
