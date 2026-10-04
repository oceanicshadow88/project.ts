import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Extension, JSONContent } from '@tiptap/core';
import ImageResize from 'tiptap-extension-resize-image';
import style from './TipTapEditor.module.scss';
import './mention.scss';
import TooLBar from './ToolBar/ToolBar';
import { CommentEditorToolBarButtonConfig } from './@const/CommentEditorToolBarButtonConfig';
import { IUserInfo } from '../../types';
import { createMentionExtension } from './@const/MentionExtension';
import { DropUploadImageExtension } from './@const/DropUploadImageExtension';
import { useAiOptimize } from './hooks/useAiOptimize';

interface ICommentEditorProps {
  onSubmit: (content: JSONContent) => void | Promise<void>;
  onCancel: () => void;
  initialContent?: JSONContent;
  users: IUserInfo[];
  aiOptimizeAction: 'optimizeTicketDescription' | 'optimizeText';
  placeholder?: string;
  submitOnModEnter?: boolean;
}

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

function TipTapEditor({
  onSubmit,
  onCancel,
  initialContent,
  users,
  aiOptimizeAction,
  placeholder,
  submitOnModEnter = false
}: ICommentEditorProps) {
  const { optimize, isLoading } = useAiOptimize();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The editor is created once, so it reads the latest props through refs.
  const usersRef = useRef(users);
  usersRef.current = users;
  const submitShortcutRef = useRef<() => boolean>(() => false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageResize,
      createMentionExtension(() => usersRef.current),
      DropUploadImageExtension,
      Extension.create({
        name: 'submitShortcut',
        addKeyboardShortcuts() {
          return { 'Mod-Enter': () => submitShortcutRef.current() };
        }
      })
    ],
    content: initialContent || ''
  });

  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  const isContentEmpty = (content?: JSONContent): boolean => {
    return (
      !content?.content ||
      content?.content.every((node) => {
        return node.type === 'paragraph' && (!node.content || node.content.length === 0);
      })
    );
  };

  const isContentUnchanged = (content: JSONContent): boolean => {
    return JSON.stringify(content) === JSON.stringify(initialContent);
  };

  const handleSubmit = async () => {
    if (!editor || isSubmitting) return;

    const content = editor.getJSON();
    if (isContentEmpty(content) || isContentUnchanged(content)) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      if (!editor.isDestroyed) {
        editor.commands.clearContent();
      }
    } catch {
      // Keep the content so it is not lost; the parent shows the error.
    } finally {
      setIsSubmitting(false);
    }
  };

  submitShortcutRef.current = () => {
    if (!submitOnModEnter) return false;
    handleSubmit();
    return true;
  };

  const handleAiOptimize = async () => {
    if (!editor) return;
    const text = editor.getText();
    const result = await optimize(text, aiOptimizeAction);
    if (result) {
      editor.commands.setContent(result);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className={style.commentEditor}>
      <div className={`${style.baseBorder} ${isLoading ? style.rainbowBorder : ''}`}>
        <TooLBar
          editor={editor}
          groups={CommentEditorToolBarButtonConfig}
          onAiButtonClick={handleAiOptimize}
          loading={isLoading}
        />
        <div className={style.editorBody}>
          <EditorContent editor={editor} />
          {placeholder && editor.isEmpty && (
            <div className={style.placeholder} data-testid="editor-placeholder">
              {placeholder}
            </div>
          )}
        </div>
      </div>

      <div className={style.buttonContainer}>
        <button onClick={handleSubmit} className={style.submitButton} disabled={isSubmitting}>
          {!isContentEmpty(initialContent) ? 'Update' : 'Submit'}
        </button>
        <button onClick={onCancel} className={style.cancelButton}>
          Cancel
        </button>
        {submitOnModEnter && (
          <span className={style.shortcutHint}>{isMac ? '⌘' : 'Ctrl'} + Enter to submit</span>
        )}
      </div>
    </div>
  );
}

export default TipTapEditor;
