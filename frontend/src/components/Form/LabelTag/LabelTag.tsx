/* eslint-disable jsx-a11y/tabindex-no-positive */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React from 'react';
import { TiDelete } from 'react-icons/ti';

interface ILabel {
  id: string;
  name: string;
  color?: string;
}

interface ILabelTagProps {
  label: ILabel;
  projectLabels?: ILabel[];
  isReadOnly?: boolean;
  onLabelClick?: (labelId: string) => void;
  onRemoveLabel?: (labelId: string) => void;
}

export default function LabelTag({
  label,
  //   projectLabels = [],
  isReadOnly = false,
  onLabelClick,
  onRemoveLabel
}: Readonly<ILabelTagProps>) {
  // Enrich label with color from project details if missing
  // const fullLabel = projectLabels.find((l) => l.id === label.id) || label;
  const labelColor = label.color || '#6a2add';

  return (
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    /* eslint-disable jsx-a11y/interactive-supports-focus */
    /* eslint-disable jsx-a11y/prefer-tag-over-role */
    <div
      key={label.id}
      className="inline-flex items-center border border-light border-l-5 rounded-md px-2 py-0.75 text-13 text-gray-700 bg-gray-100 max-w-150 cursor-default transition-opacity hover:opacity-85 focus-within:opacity-85"
      style={{
        borderLeft: `5px solid ${labelColor}`,
        cursor: onLabelClick ? 'pointer' : 'default'
      }}
      onClick={(e) => {
        // Only filter if clicking on the label itself, not the remove button
        if (onLabelClick && !(e.target as HTMLElement).closest('.tag-remove-btn')) {
          onLabelClick(label.id);
        }
      }}
      role={onLabelClick ? 'button' : undefined}
      tabIndex={onLabelClick ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onLabelClick) {
          e.preventDefault();
          onLabelClick(label.id);
        }
      }}
    >
      <span className="whitespace-nowrap overflow-hidden truncate">{label.name}</span>
      {!isReadOnly && onRemoveLabel && (
        <button
          type="button"
          className="tag-remove-btn inline-flex items-center justify-center border-none bg-transparent text-gray-700 cursor-pointer p-0 relative hover:opacity-85 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveLabel(label.id);
          }}
          aria-label={`Remove ${label.name}`}
        >
          <TiDelete size={12} />
          <span className="tag-remove-btn-tooltip">Remove Label</span>
        </button>
      )}
    </div>
  );
}
