import React, { useState } from 'react';
import { GoBug } from 'react-icons/go';
import { RiTaskLine, RiToolsLine } from 'react-icons/ri';
import { HiOutlineBookOpen } from 'react-icons/hi';
import { FiFile } from 'react-icons/fi';

interface TypeIconProps {
  readonly imgUrl?: string;
  readonly name?: string;
  readonly iconSize?: number;
  readonly className?: string;
}

export default function TypeIcon({ imgUrl, name, iconSize = 20, className }: TypeIconProps) {
  const [error, setError] = useState(false);
  const lower = (name || '').toLowerCase();

  if (!error && imgUrl) {
    return <img src={imgUrl} alt={name} className={className} onError={() => setError(true)} />;
  }

  // Color and size for fallback icons (do NOT change icon shapes)
  const colorMap: Record<string, string> = {
    bug: '#dc2626', // red
    task: '#3b82f6', // blue
    story: 'var(--primary-color)', // theme purple
    tech: '#f59e0b', // amber
    default: '#6b7280' // gray
  };
  const size = iconSize;

  if (lower.includes('bug')) {
    return <GoBug size={size} aria-label={name} className={className} color={colorMap.bug} />;
  }
  if (lower.includes('story')) {
    return (
      <HiOutlineBookOpen
        size={size}
        aria-label={name}
        className={className}
        color={colorMap.story}
      />
    );
  }
  if (lower.includes('task')) {
    return <RiTaskLine size={size} aria-label={name} className={className} color={colorMap.task} />;
  }
  if (lower.includes('tech')) {
    return (
      <RiToolsLine size={size} aria-label={name} className={className} color={colorMap.tech} />
    );
  }
  return <FiFile size={size} aria-label={name} className={className} color={colorMap.default} />;
}
