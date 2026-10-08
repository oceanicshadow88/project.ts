import React, { useEffect, useMemo, useState } from 'react';
import { generateHTML, JSONContent } from '@tiptap/core';
import Mention from '@tiptap/extension-mention';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import parse from 'html-react-parser';
import { toast } from 'react-toastify';
import { GoComment } from 'react-icons/go';
import TipTapEditor from '../../../TipTapEditor/TipTapEditor';
import {
  createComment,
  deleteComment,
  getComment,
  updateComment
} from '../../../../api/comment/comment';
import { IUserInfo } from '../../../../types';
import checkAccess from '../../../../utils/helpers';
import Avatar from '../../../Avatar/Avatar';
import TimeAgo from '../../../TimeAgo/TimeAgo';
import { Permission } from '../../../../utils/permission';
import styles from './CommentsSession.module.scss';

interface ICommentsSessionProps {
  userId?: string;
  users: IUserInfo[];
  ticketId?: string;
  projectId: string;
}

interface IComment {
  content: string;
  createdAt: string;
  id: string;
  sender: IUserInfo;
  ticket: string;
  updatedAt: string;
  _v: number;
}

const COMMENT_PLACEHOLDER = 'Add a comment… Type @ to mention a teammate';

const parseContent = (content: string): JSONContent | undefined => {
  try {
    return JSON.parse(content);
  } catch {
    return undefined;
  }
};

const isEdited = (comment: IComment) =>
  new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime();

function CommentsSession(Props: ICommentsSessionProps) {
  const { userId = '', ticketId = '', users = [], projectId = '' } = Props;
  const [comments, setComments] = useState<IComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const fetchCommentsData = async () => {
    try {
      const result = await getComment(ticketId);
      setComments(result.data);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchCommentsData();
  }, [ticketId]);

  const editingInitialContent = useMemo(() => {
    const comment = comments.find((item) => item.id === editingCommentId);
    return comment ? parseContent(comment.content) : undefined;
  }, [comments, editingCommentId]);

  const handleSubmit = async (content: JSONContent) => {
    try {
      await createComment({ ticket: ticketId, sender: userId, content: JSON.stringify(content) });
    } catch (error) {
      toast.error('Failed to post comment. Please try again.');
      throw error;
    }
    setIsCreating(false);
    fetchCommentsData();
  };

  const handleUpdate = async (commentId: string, content: JSONContent) => {
    try {
      await updateComment(commentId, JSON.stringify(content));
    } catch (error) {
      toast.error('Failed to update comment. Please try again.');
      throw error;
    }
    setEditingCommentId(null);
    fetchCommentsData();
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setDeletingCommentId(null);
      fetchCommentsData();
    } catch {
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };

  const renderCommentContent = (content: string) => {
    const jsonContent = parseContent(content);
    if (!jsonContent) {
      return <p>Invalid content</p>;
    }
    return parse(generateHTML(jsonContent, [StarterKit, ImageResize, Mention]));
  };

  const renderActions = (comment: IComment) => {
    if (deletingCommentId === comment.id) {
      return (
        <div className={styles.deleteConfirm} data-testid="delete-comment-confirm">
          <span className={styles.deleteQuestion}>Delete this comment? This can’t be undone.</span>
          <button
            type="button"
            className={styles.confirmCancel}
            onClick={() => setDeletingCommentId(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmDelete}
            onClick={() => handleDelete(comment.id)}
            data-testid="confirm-delete-comment"
          >
            Delete
          </button>
        </div>
      );
    }
    return (
      <div className="flex gap-2.5 pl-8 mt-1.5">
        <button
          onClick={() => setEditingCommentId(comment.id)}
          className="bg-transparent border-0 text-gray-200 hover-text-primary font-medium text-13 cursor-pointer py-1.5 px-3 rounded hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          onClick={() => setDeletingCommentId(comment.id)}
          className="bg-transparent border-0 text-gray-200 hover-text-primary font-medium text-13 cursor-pointer py-1.5 px-3 rounded hover:bg-gray-50"
          data-testid="delete-comment"
        >
          Delete
        </button>
      </div>
    );
  };

  const renderCommentsList = () => {
    if (isLoading) {
      return (
        <div className={styles.loading} data-testid="comments-loading">
          {[0, 1].map((row) => (
            <div key={row} className={styles.skeletonItem}>
              <div className={styles.skeletonHeader}>
                <span className={styles.skeletonAvatar} />
                <span className={styles.skeletonName} />
              </div>
              <span className={styles.skeletonLine} />
              <span className={`${styles.skeletonLine} ${styles.short}`} />
            </div>
          ))}
        </div>
      );
    }

    if (!comments.length) {
      return (
        <div className={styles.empty} data-testid="comments-empty">
          <span className={styles.emptyIcon}>
            <GoComment />
          </span>
          <p>No comments yet.</p>
          <p>Be the first to add one.</p>
        </div>
      );
    }

    return (
      <div className="p-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex flex-col gap-2 py-3 border-b border-gray-200"
            data-testid="comment-item"
          >
            <div className="flex items-center justify-between gap-3 text-15 mb-2">
              <div className="flex items-center gap-2.5 font-medium text-black">
                <Avatar
                  avatarIcon={comment?.sender?.avatarIcon}
                  backgroundColor={comment?.sender?.backgroundColor}
                  name={comment?.sender?.name}
                />
                <span>{comment.sender?.name}</span>
              </div>
              <span>
                <TimeAgo date={comment.createdAt} className="text-gray-200 text-13 font-normal" />
                {isEdited(comment) && (
                  <span className={styles.edited} data-testid="comment-edited">
                    · edited
                  </span>
                )}
              </span>
            </div>

            {editingCommentId === comment.id ? (
              <div className="comment-editor-wrapper">
                <TipTapEditor
                  onSubmit={(content) => handleUpdate(comment.id, content)}
                  onCancel={handleCancelEdit}
                  initialContent={editingInitialContent}
                  users={users}
                  aiOptimizeAction="optimizeText"
                  submitOnModEnter
                />
              </div>
            ) : (
              <>
                <div
                  className={`text-black text-13 pl-8 ${styles.commentContent}`}
                  data-testid="comment-content"
                >
                  {renderCommentContent(comment.content)}
                </div>
                {checkAccess(Permission.EditTickets, projectId) && renderActions(comment)}
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {checkAccess(Permission.AddComments, projectId) &&
        (isCreating ? (
          <TipTapEditor
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            users={users}
            aiOptimizeAction="optimizeText"
            placeholder={COMMENT_PLACEHOLDER}
            submitOnModEnter
          />
        ) : (
          <button
            type="button"
            className={styles.addComment}
            onClick={() => setIsCreating(true)}
            data-testid="add-comment"
          >
            {COMMENT_PLACEHOLDER}
          </button>
        ))}
      {checkAccess(Permission.EditTickets, projectId) && renderCommentsList()}
    </>
  );
}

export default CommentsSession;
