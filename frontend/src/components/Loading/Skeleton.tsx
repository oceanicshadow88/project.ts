import React from 'react';
import styles from './Skeleton.module.scss';

interface ISkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  count?: number;
  className?: string;
  dataTestId?: string;
}

// Numbers are px, strings pass through, so width={28} and width="55%" both work
const toCssSize = (value?: string | number) => (typeof value === 'number' ? `${value}px` : value);

/* A single grey placeholder block for content that is still loading.
 *
 * Radius: border radius
 * Count: number of blocks
 * 
 */
export default function Skeleton({
  width,
  height,
  radius,
  count = 1,
  className = '',
  dataTestId
}: ISkeletonProps) {
  const style = {
    width: toCssSize(width),
    height: toCssSize(height),
    borderRadius: toCssSize(radius)
  };

  // Identical skeleton blocks, with index as identifier
  const blockKeys = Array.from({ length: count }, (_, index) => `skeleton-${index}`);

  return (
    <>
      {blockKeys.map((blockKey) => (
        <span
          key={blockKey}
          className={`${styles.skeleton} ${className}`}
          style={style}
          data-testid={dataTestId}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
