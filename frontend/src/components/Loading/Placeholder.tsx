import React from 'react';
import styles from './Placeholder.module.scss';

interface IPlaceholderProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  dataTestId?: string;
}

// Numbers are px, strings pass through, so width={28} and width="55%" both work
const toCssSize = (value?: string | number) => (typeof value === 'number' ? `${value}px` : value);

/* A single grey placeholder block for content that is still loading.
 * Width: block width
 * Height: block height
 * Radius: border radius
 */
export default function Placeholder({
  width,
  height,
  radius,
  className = '',
  dataTestId
}: IPlaceholderProps) {
  const style = {
    width: toCssSize(width),
    height: toCssSize(height),
    borderRadius: toCssSize(radius)
  };

  return (
    <span
      className={`${styles.placeholder} ${className}`}
      style={style}
      data-testid={dataTestId}
      aria-hidden="true"
    />
  );
}
