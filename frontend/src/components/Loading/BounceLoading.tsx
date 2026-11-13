import React from 'react';
import styles from './BounceLoading.module.scss';

interface IBounceLoading {
  height?: string;
}

export default function BounceLoading(props: IBounceLoading) {
  const { height = '90vh' } = props;
  return (
    <div className={styles.loadingContainer} style={{ height }}>
      <div className={styles.bounce}>
        <div />
        <div />
        <div />
        <div />
      </div>
    </div>
  );
}

BounceLoading.defaultProps = {
  height: '90vh'
};
