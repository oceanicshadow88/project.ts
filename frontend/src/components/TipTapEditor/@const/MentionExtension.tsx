import Mention from '@tiptap/extension-mention';
import tippy, { Instance, GetReferenceClientRect } from 'tippy.js';
import { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import MentionList, { IMentionListRef, IMentionItem } from '../MentionList/MentionList';

export const filterMentionItems = (items: IMentionItem[], query: string): IMentionItem[] => {
  const keyword = query.trim().toLowerCase();
  return items.filter((item) => {
    const name = item.name?.toLowerCase() ?? '';
    const email = item.email?.toLowerCase() ?? '';
    return name.includes(keyword) || email.includes(keyword);
  });
};

// getMentionItems is read every time "@" is typed, so members loaded after the editor
// was created are still listed.
export const createMentionExtension = (getMentionItems: () => IMentionItem[]) => {
  return Mention.configure({
    HTMLAttributes: {
      class: 'mention'
    },
    // Backspace after a mention removes the whole mention instead of turning it back into "@".
    deleteTriggerWithBackspace: true,

    suggestion: {
      char: '@',
      items: ({ query }: { query: string }) => filterMentionItems(getMentionItems(), query),

      render: () => {
        let component: (ReactRenderer & { ref: IMentionListRef | null }) | undefined;
        let popup: Instance | undefined;
        // Set by Esc. The keys go back to the editor until this "@" is finished.
        let isDismissed = false;

        const createPopup = (suggestionProps: SuggestionProps<IMentionItem>) => {
          if (!component || !suggestionProps.clientRect) {
            return;
          }
          popup = tippy(document.body, {
            getReferenceClientRect: () => suggestionProps.clientRect?.() ?? new DOMRect(),
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start'
          });
        };

        return {
          onStart: (suggestionProps: SuggestionProps<IMentionItem>) => {
            isDismissed = false;
            component = new ReactRenderer(MentionList, {
              props: suggestionProps,
              editor: suggestionProps.editor
            }) as ReactRenderer & { ref: IMentionListRef | null };
            createPopup(suggestionProps);
          },

          onUpdate: (suggestionProps: SuggestionProps<IMentionItem>) => {
            component?.updateProps(suggestionProps);

            if (!suggestionProps.clientRect) {
              return;
            }
            if (!popup) {
              createPopup(suggestionProps);
              return;
            }
            popup.setProps({
              getReferenceClientRect: suggestionProps.clientRect as GetReferenceClientRect
            });
          },

          onKeyDown: (suggestionProps: SuggestionKeyDownProps) => {
            if (isDismissed) {
              return false;
            }
            if (suggestionProps.event.key === 'Escape') {
              isDismissed = true;
              popup?.hide();
              return true;
            }

            return component?.ref?.onKeyDown({ event: suggestionProps.event }) ?? false;
          },

          onExit: () => {
            popup?.destroy();
            component?.destroy();
            popup = undefined;
            component = undefined;
          }
        };
      }
    }
  });
};
