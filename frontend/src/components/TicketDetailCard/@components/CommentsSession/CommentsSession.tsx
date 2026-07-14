import React, { useEffect, useState } from 'react';
import { generateHTML, JSONContent } from '@tiptap/core';
import Mention from '@tiptap/extension-mention';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import parse from 'html-react-parser';
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

function CommentsSession(Props: ICommentsSessionProps) {
  const { userId = '', ticketId = '', users = [], projectId = '' } = Props;
  const [comments, setComments] = useState<IComment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const fetchCommentsData = async () => {
    const result = await getComment(ticketId);
    setComments(result.data);
  };

  useEffect(() => {
    fetchCommentsData();
  }, [ticketId]);

  const handleSubmit = async (content: JSONContent, commentId?: string) => {
    const stringifiedContent = JSON.stringify(content);

    const saveActions = {
      create: () =>
        createComment({ ticket: ticketId, sender: userId, content: stringifiedContent }),
      update: () => updateComment(commentId as string, stringifiedContent)
    };

    const action = commentId ? 'update' : 'create';
    await saveActions[action]();

    fetchCommentsData();
    setIsEditing(false);
  };

  const handleDelete = async (id?: string) => {
    if (!id) {
      return;
    }
    await deleteComment(id);
    fetchCommentsData();
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEditSubmit = (content: JSONContent, commentId?: string) => {
    if (commentId) {
      handleSubmit(content, commentId);
    }
    setEditingCommentId(null);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };

  const renderCommentContent = (content: string) => {
    try {
      const jsonContent: JSONContent = JSON.parse(content);
      const html = generateHTML(jsonContent, [StarterKit, ImageResize, Mention]);
      const fixedHtml = html.replaceAll('<p>', '<span>').replaceAll('</p>', '</span>');
      return parse(fixedHtml);
    } catch {
      return parse('<p>Invalid content</p>');
    }
  };

  const renderCommentsList = () => {
    return (
      <div className="p-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex flex-col gap-2 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between gap-3 text-15 mb-2">
              <div className="flex items-center gap-2.5 font-medium text-black">
                <Avatar
                  avatarIcon={comment?.sender?.avatarIcon}
                  backgroundColor={comment?.sender?.backgroundColor}
                  name={comment?.sender?.name}
                />
                <span>{comment.sender?.name}</span>
              </div>
              <TimeAgo date={comment.createdAt} className="text-gray-200 text-13 font-normal" />
            </div>

            {editingCommentId === comment.id ? (
              <div className="comment-editor-wrapper">
                <TipTapEditor
                  onSubmit={(content) => handleEditSubmit(content, comment.id)}
                  onCancel={handleCancelEdit}
                  initialContent={JSON.parse(comment.content)}
                  users={users}
                  aiOptimizeAction="optimizeText"
                />
              </div>
            ) : (
              <>
                <div className="text-black text-13 pl-8">
                  {renderCommentContent(comment.content)}
                </div>
                {checkAccess(Permission.EditTickets, projectId) && (
                  <div className="flex gap-2.5 pl-8 mt-1.5">
                    <button
                      onClick={() => setEditingCommentId(comment.id)}
                      className="bg-transparent border-0 text-gray-200 hover-text-primary font-medium text-13 cursor-pointer py-1.5 px-3 rounded hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="bg-transparent border-0 text-gray-200 hover-text-primary font-medium text-13 cursor-pointer py-1.5 px-3 rounded hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
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
        (isEditing ? (
          <TipTapEditor
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            users={users}
            aiOptimizeAction="optimizeText"
          />
        ) : (
          <button
            className="flex border border-gray-200 text-gray rounded-md bg-white p-4 w-full cursor-pointer text-15 shadow-none border-solid hover-bg-gray-50"
            onClick={() => setIsEditing(true)}
            style={{ minHeight: '100px' }}
          >
            Input comments here...
          </button>
        ))}
      {checkAccess(Permission.EditTickets, projectId) && renderCommentsList()}
    </>
  );
}

export default CommentsSession;
