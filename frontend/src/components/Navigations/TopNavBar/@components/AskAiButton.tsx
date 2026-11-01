import React, { useContext, useEffect, useRef } from 'react';
import { FaRobot } from 'react-icons/fa';
import { AiChatContext } from '../../../../context/AiChatProvider';
import { getAskAiButtonState } from '../../../../utils/aiChatService';

export default function AskAiButton() {
  const { isOpen, setIsOpen, activeProjectId } = useContext(AiChatContext);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(isOpen);

  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      buttonRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  const buttonState = getAskAiButtonState(activeProjectId);

  if (buttonState === 'hidden') {
    return null;
  }

  const isDisabled = buttonState === 'disabled';

  // The right side of the nav has overflow: hidden, which would cut off a CSS tooltip
  return (
    <span className="flex-shrink-0" title={isDisabled ? 'Open a project to use AI' : undefined}>
      <button
        ref={buttonRef}
        type="button"
        className={[
          'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
          'border-2 border-solid border-primary transition-all',
          isOpen ? 'bg-primary text-white' : 'bg-transparent text-black',
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        ].join(' ')}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled}
        aria-pressed={isOpen}
        data-testid="ask-ai-btn"
      >
        <FaRobot aria-hidden="true" />
        Ask AI
      </button>
    </span>
  );
}
