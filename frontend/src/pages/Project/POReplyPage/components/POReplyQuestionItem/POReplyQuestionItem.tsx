import React, { useState } from 'react';
import { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import { Mention } from '@tiptap/extension-mention';
import parse from 'html-react-parser';
import { IQuestion } from '../../../../../api/question/entity/question';
import { IReply } from '../../../../../api/reply/entity/reply';
import { IUserInfo } from '../../../../../types';
import TipTapEditor from '../../../../../components/TipTapEditor/TipTapEditor';
import ButtonV2 from '../../../../../lib/FormV2/ButtonV2/ButtonV2';

interface QuestionWithTicket extends IQuestion {
  ticket: {
    id: string;
    title: string;
    sprint?: {
      id: string;
      name: string;
      status?: 'active' | 'planning' | 'completed';
    } | null;
  };
}

interface POReplyQuestionItemProps {
  question: QuestionWithTicket;
  replies: IReply[];
  users: IUserInfo[];
  currentUserId: string;
  onCreateReply: (questionId: string, content: JSONContent) => Promise<void>;
  onUpdateReply?: (replyId: string, content: JSONContent) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  creatingReplyForQuestion: string | null;
  setCreatingReplyForQuestion: (questionId: string | null) => void;
}

function POReplyQuestionItem({
  question,
  replies,
  users,
  currentUserId,
  onCreateReply,
  onUpdateReply,
  onDeleteReply,
  creatingReplyForQuestion,
  setCreatingReplyForQuestion
}: POReplyQuestionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editedReplyContent, setEditedReplyContent] = useState<JSONContent | null>(null);

  const renderContent = (content: string) => {
    try {
      const jsonContent: JSONContent = typeof content === 'string' ? JSON.parse(content) : content;
      const html = generateHTML(jsonContent, [StarterKit, ImageResize, Mention]);
      const fixedHtml = html.replace(/<p>/g, '<span>').replace(/<\/p>/g, '</span>');
      return parse(fixedHtml);
    } catch (error) {
      return <span>Invalid content</span>;
    }
  };

  const handleSubmitReply = async (content: JSONContent) => {
    if (!content) {
      // eslint-disable-next-line no-console
      console.warn('No content provided for reply');
      return;
    }
    try {
      // eslint-disable-next-line no-console
      console.log('Submitting reply for question:', question.id, content);
      await onCreateReply(question.id, content);
      // Don't set creatingReplyForQuestion to null here - let the parent handle it
      // setCreatingReplyForQuestion(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error submitting reply:', error);
      // Error handled by parent, but reset the editor state on error
      setCreatingReplyForQuestion(null);
    }
  };

  const handleCancelReply = () => {
    setCreatingReplyForQuestion(null);
  };

  const ticket = typeof question.ticket === 'object' && question.ticket ? question.ticket : null;
  const sprint = ticket?.sprint;
  const priorityColors: { [key: string]: string } = {
    Highest: '#dc2626',
    High: '#f97316',
    Medium: '#6b7280',
    Low: '#0ea5e9',
    Lowest: '#22c55e'
  };

  // Check if the last reply is from the current user
  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;
  const hasReplied = lastReply?.createdBy?.id === currentUserId;
  const isNew = replies.length === 0;
  const needsReply = replies.length > 0 && !hasReplied;

  return (
    <div className="bg-white border border-light rounded-xl p-6 transition-all hover:shadow-md">
      {/* Ticket Title */}
      <div className="text-15 text-gray mb-3 pb-2 border-b border-light flex items-center gap-2">
        <div>
          <strong className="text-gray-dark font-large">
            Ticket: {ticket?.title || 'Unknown Ticket'}
          </strong>
        </div>
        {hasReplied && (
          <span className="bg-green text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            Replied
          </span>
        )}
        {isNew && (
          <span className="bg-primary text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
            New
          </span>
        )}
        {needsReply && (
          <span className="bg-yellow-light text-amber px-2 py-1 rounded text-xs font-medium whitespace-nowrap border border-yellow">
            Awaiting Response
          </span>
        )}
      </div>

      {/* Question */}
      <div
        className="text-15 font-normal text-gray-dark mb-3 cursor-pointer flex justify-between items-center leading-relaxed hover:text-primary"
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsExpanded(!isExpanded);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <h3 className="m-0 flex-1 text-15 font-normal text-gray-dark">{question.title}</h3>
        <span className="text-gray text-xs ml-2">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* Sprint and Priority */}
      <div className="flex gap-4 mb-3 text-13 text-gray flex-wrap">
        {sprint && (
          <div>
            <strong className="text-gray-dark font-medium">Sprint:</strong> {sprint.name} (
            {sprint.status || 'planning'})
          </div>
        )}
        <div
          className="font-medium"
          style={{ color: priorityColors[question.priority] || '#6b7280' }}
        >
          <strong className="text-gray-dark font-medium">Priority:</strong> {question.priority}
        </div>
      </div>

      {/* Replies Section */}
      {isExpanded && replies.length > 0 && (
        <div className="mt-4 pt-4 border-t border-light">
          {/* Existing Replies */}
          <div className="mb-4">
            {replies.map((reply) => {
              const isOwnReply = currentUserId === reply.createdBy?.id;
              const isEditing = editingReplyId === reply.id;

              return (
                <div
                  key={reply.id}
                  className="bg-gray-50 border border-light rounded-md p-3 mb-3 transition-all hover:bg-gray-100"
                >
                  <div className="mb-2 flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-12 text-gray ml-2">
                        {new Date(reply.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {isOwnReply && onUpdateReply && onDeleteReply && !isEditing && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          type="button"
                          className="bg-transparent border-none text-gray font-medium text-13 cursor-pointer px-2 py-1 rounded transition-all hover:bg-gray-100 hover:text-gray-dark"
                          onClick={() => {
                            const content =
                              typeof reply.content === 'string'
                                ? JSON.parse(reply.content)
                                : reply.content;
                            setEditedReplyContent(content);
                            setEditingReplyId(reply.id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="bg-transparent border-none text-gray font-medium text-13 cursor-pointer px-2 py-1 rounded transition-all hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            // eslint-disable-next-line no-alert
                            if (window.confirm('Are you sure you want to delete this reply?')) {
                              onDeleteReply(reply.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="mt-2">
                      <TipTapEditor
                        initialContent={editedReplyContent || undefined}
                        onSubmit={async (content) => {
                          if (onUpdateReply) {
                            await onUpdateReply(reply.id, content);
                            setEditingReplyId(null);
                            setEditedReplyContent(null);
                          }
                        }}
                        onCancel={() => {
                          setEditingReplyId(null);
                          setEditedReplyContent(null);
                        }}
                        users={users}
                        aiOptimizeAction="optimizeText"
                      />
                    </div>
                  ) : (
                    <div className="text-14 text-gray-dark leading-relaxed">
                      {renderContent(reply.content)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Reply Section - Always Visible */}
      <div className="mt-4 pt-4 border-t border-light">
        {creatingReplyForQuestion === question.id ? (
          <div className="bg-gray-50 border border-light rounded-md p-4">
            <TipTapEditor
              onSubmit={async (content) => {
                await handleSubmitReply(content);
              }}
              onCancel={handleCancelReply}
              users={users}
              aiOptimizeAction="optimizeText"
            />
          </div>
        ) : (
          <ButtonV2
            text="Add Reply"
            fill
            onClick={() => {
              // eslint-disable-next-line no-console
              console.log('Add Reply button clicked for question:', question.id);
              setCreatingReplyForQuestion(question.id);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default POReplyQuestionItem;
