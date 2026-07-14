import React from 'react';
import styles from './ButtonGetStart.module.scss';

interface Props {
  onClick?: () => void;
}

function ButtonGetStart({ onClick }: Props) {
  return (
    <button className={styles.buttonGetStart} onClick={onClick}>
      Get Started
    </button>
  );
}

export default ButtonGetStart;
