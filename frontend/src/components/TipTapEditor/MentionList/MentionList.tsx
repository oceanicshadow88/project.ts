import './MentionList.scss';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Avatar from '../../Avatar/Avatar';

export interface IMentionItem {
  id?: string | null;
  name?: string;
  email?: string;
  avatarIcon?: string;
  backgroundColor?: string;
}

export interface IMentionListProps {
  items: IMentionItem[];
  command: (params: { id: string | null; label: string }) => void;
}

export interface IMentionListRef {
  onKeyDown: (args: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<IMentionListRef, IMentionListProps>((props, ref) => {
  const { items, command } = props;
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectItem = (index: number): void => {
    const item = items[index];
    if (item) {
      command({ id: item.id ?? null, label: item.name ?? '' });
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (!items.length) {
        return false;
      }
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      // Cmd/Ctrl + Enter submits the comment, so only a plain Enter selects a member.
      if ((event.key === 'Enter' && !event.metaKey && !event.ctrlKey) || event.key === 'Tab') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    }
  }));

  return (
    <div className="mention-list" data-testid="mention-list">
      <div className="mention-list__header">Project members</div>
      {items.length ? (
        <div className="mention-list__items">
          {items.map((item, index) => (
            <button
              type="button"
              key={item.id ?? item.email ?? item.name}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              className={`mention-list__item${index === selectedIndex ? ' is-selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectItem(index)}
              data-testid="mention-item"
            >
              <Avatar
                avatarIcon={item.avatarIcon}
                backgroundColor={item.backgroundColor}
                name={item.name}
                size={28}
              />
              <span className="mention-list__text">
                <span className="mention-list__name">{item.name}</span>
                {item.email && <span className="mention-list__email">{item.email}</span>}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mention-list__empty">No matching members</div>
      )}
    </div>
  );
});

export default MentionList;
