import React, { useState } from 'react';
import { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import { Mention } from '@tiptap/extension-mention';
import parse from 'html-react-parser';
import { IoWarning } from 'react-icons/io5';
import { IQuestion } from '../../api/question/entity/question';
import { IReply } from '../../api/reply/entity/reply';
import { IUserInfo } from '../../types';
import Avatar from '../Avatar/Avatar';
import TimeAgo from '../TimeAgo/TimeAgo';
import TipTapEditor from '../TipTapEditor/TipTapEditor';
import PriorityBtn from '../Form/PriorityBtn/PriorityBtn';
import AssigneeBtn from '../Form/AssigneeBtn/AssigneeBtn';
import Modal from '../../lib/Modal/Modal';
import styles from './QuestionItem.module.scss';

interface QuestionItemProps {
  question: IQuestion;
  replies: IReply[];
  isExpanded: boolean;
  onToggleExpanded: (questionId: string) => void;
  onToggleWaitingForStakeholder?: (questionId: string, currentStatus: boolean) => void;
  onToggleResolved?: (questionId: string, currentStatus: boolean) => void;
  onUpdatePriority?: (questionId: string, priority: string) => void;
  onUpdateAssignee?: (questionId: string, assigneeId: string | null) => void;
  onUpdateQuestion?: (questionId: string, title: string) => Promise<void>;
  onDeleteQuestion?: (questionId: string) => Promise<void>;
  onCreateReply: (questionId: string, content: JSONContent) => Promise<void>;
  onUpdateReply?: (replyId: string, content: JSONContent) => Promise<void>;
  onDeleteReply?: (replyId: string) => Promise<void>;
  creatingReplyForQuestion: string | null;
  setCreatingReplyForQuestion: (questionId: string | null) => void;
  users: IUserInfo[];
  showTicketInfo?: boolean;
  currentUserId?: string;
}

function QuestionItem({
  question,
  replies,
  isExpanded,
  onToggleExpanded,
  onToggleWaitingForStakeholder,
  onToggleResolved,
  onUpdatePriority,
  onUpdateAssignee,
  onUpdateQuestion,
  onDeleteQuestion,
  onCreateReply,
  onUpdateReply,
  onDeleteReply,
  creatingReplyForQuestion,
  setCreatingReplyForQuestion,
  users,
  showTicketInfo = false,
  currentUserId
}: QuestionItemProps) {
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedTitle, setEditedTitle] = useState(question.title);
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const questionReplies = replies || [];
  const latestReply =
    questionReplies.length > 0 ? questionReplies[questionReplies.length - 1] : null;
  let allReplies: IReply[] = [];
  if (isExpanded) {
    allReplies = questionReplies;
  } else if (latestReply) {
    allReplies = [latestReply];
  }

  // Check if assignee has replied
  const assigneeHasReplied = question.assignee
    ? questionReplies.some((reply) => reply.createdBy?.id === question.assignee?.id)
    : false;

  const renderContent = (content: string) => {
    try {
      const jsonContent: JSONContent = JSON.parse(content);
      const html = generateHTML(jsonContent, [StarterKit, ImageResize, Mention]);
      const fixedHtml = html.replace(/<p>/g, '<span>').replace(/<\/p>/g, '</span>');
      return parse(fixedHtml);
    } catch (error) {
      return <span>Invalid content</span>;
    }
  };

  const { ticket } = question;
  const ticketTitle = typeof ticket === 'string' ? '' : ticket.title;
  const sprintName = typeof ticket === 'string' ? '' : ticket.sprint?.name || 'No Sprint';

  const handleSaveQuestion = async () => {
    if (onUpdateQuestion && editedTitle.trim()) {
      await onUpdateQuestion(question.id, editedTitle.trim());
      setIsEditingQuestion(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(question.title);
    setIsEditingQuestion(false);
  };

  const onClickWarning = () => {
    setIsMessagesModalOpen(true);
  };

  const renderMessagesModal = () => {
    if (!isMessagesModalOpen) return null;

    return (
      <Modal classesName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-xl font-semibold">Question Messages</h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              onClick={() => setIsMessagesModalOpen(false)}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {question.messages && question.messages.length > 0 ? (
              <div className="space-y-3">
                {question.messages.map((message, index) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${question.id}-message-${index}`}
                    className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400"
                  >
                    <p className="text-gray-800">{message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No messages available for this question.
              </p>
            )}
          </div>

          <div className="flex justify-end p-6 border-t">
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              onClick={() => setIsMessagesModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className={styles.questionItem}>
      <div>
        {question.isClear ? null : (
          <IoWarning fontSize={20} className="text-alert mb-1" onClick={onClickWarning} />
        )}
      </div>
      <div className={styles.questionHeader}>
        {isEditingQuestion ? (
          <div className={styles.editQuestionContainer}>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className={styles.editQuestionInput}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <div className={styles.editQuestionActions}>
              <button
                className={styles.saveQuestionButton}
                onClick={handleSaveQuestion}
                disabled={!editedTitle.trim()}
              >
                Save
              </button>
              <button className={styles.cancelQuestionButton} onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.questionTitleRow}>
            <div
              className={`${styles.questionTitle}${
                question.isResolved ? ` ${styles.resolved}` : ''
              }`}
            >
              {question.title}
            </div>
            {onUpdateQuestion &&
              onDeleteQuestion &&
              currentUserId === question.createdBy?.id &&
              !question.isResolved && (
                <div className={styles.questionActions}>
                  <button
                    className={styles.editQuestionButton}
                    onClick={() => setIsEditingQuestion(true)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.deleteQuestionButton}
                    onClick={() => {
                      // eslint-disable-next-line no-alert
                      if (window.confirm('Are you sure you want to delete this question?')) {
                        onDeleteQuestion(question.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
          </div>
        )}
        <div className={styles.questionMeta}>
          {showTicketInfo && (
            <>
              <span className={styles.ticketInfo}>Ticket: {ticketTitle}</span>
              <span className={styles.sprintInfo}>Sprint: {sprintName}</span>
            </>
          )}
          {onUpdatePriority && !question.isResolved ? (
            <div className={styles.priorityDropdown}>
              <PriorityBtn
                priority={question.priority}
                ticketId={
                  typeof question.ticket === 'string' ? question.ticket : question.ticket?.id || ''
                }
                onChange={(value) => {
                  if (!value) {
                    return;
                  }
                  onUpdatePriority(question.id, value);
                }}
                isDisabled={false}
              />
            </div>
          ) : (
            <span className={styles.priorityInfo}>Priority: {question.priority}</span>
          )}
          {onUpdateAssignee && !question.isResolved ? (
            <div className={styles.assigneeDropdown}>
              <AssigneeBtn
                assigneeId={question.assignee?.id}
                userList={users}
                ticketId={question.id}
                name="assignee"
                onChange={(value) => onUpdateAssignee(question.id, value ?? '')}
              />
            </div>
          ) : (
            question.assignee && (
              <span className={styles.assigneeInfo}>
                Assignee: {question.assignee.name}
                {assigneeHasReplied && <span className={styles.repliedBadge}>Replied</span>}
              </span>
            )
          )}
          {onToggleWaitingForStakeholder &&
            !question.isResolved &&
            (question.waitingForStakeholder ? (
              <button
                className={styles.waitingButton}
                onClick={() => onToggleWaitingForStakeholder(question.id, true)}
              >
                Awaiting PO
              </button>
            ) : (
              <button
                className={styles.markWaitingButton}
                onClick={() => onToggleWaitingForStakeholder(question.id, false)}
              >
                Mark as Awaiting PO
              </button>
            ))}
          {onToggleResolved && !question.isResolved && currentUserId === question.createdBy?.id && (
            <button
              className={styles.resolveButton}
              onClick={() => onToggleResolved(question.id, false)}
            >
              Resolved
            </button>
          )}
          {onToggleResolved && question.isResolved && currentUserId === question.createdBy?.id && (
            <button
              className={styles.reopenButton}
              onClick={() => onToggleResolved(question.id, true)}
            >
              Reopen Question
            </button>
          )}
        </div>
      </div>

      {questionReplies.length > 0 && (
        <div className={styles.repliesSection}>
          {questionReplies.length > 1 && !isExpanded && (
            <button className={styles.viewAllButton} onClick={() => onToggleExpanded(question.id)}>
              View all {questionReplies.length} replies
            </button>
          )}
          {isExpanded && questionReplies.length > 1 && (
            <button className={styles.viewAllButton} onClick={() => onToggleExpanded(question.id)}>
              Show only latest reply
            </button>
          )}

          <div className={styles.repliesList}>
            {(question.isResolved && isExpanded ? questionReplies : allReplies).map((reply) => (
              <div key={reply.id} className={styles.replyItem}>
                <div className={styles.replyHeader}>
                  <div className={styles.replyUserInfo}>
                    <Avatar avatarIcon={reply.createdBy?.avatarIcon} name={reply.createdBy?.name} />
                    <span>{reply.createdBy?.name}</span>
                  </div>
                  <TimeAgo date={reply.createdAt} className={styles.timeAgo} />
                </div>
                {editingReplyId === reply.id && onUpdateReply ? (
                  <div className={styles.editReplyContainer}>
                    <TipTapEditor
                      onSubmit={async (content) => {
                        await onUpdateReply(reply.id, content);
                        setEditingReplyId(null);
                      }}
                      onCancel={() => setEditingReplyId(null)}
                      initialContent={JSON.parse(reply.content)}
                      users={users}
                      aiOptimizeAction="optimizeText"
                    />
                  </div>
                ) : (
                  <div className={styles.replyContentRow}>
                    <div className={styles.replyContent}>{renderContent(reply.content)}</div>
                    {onUpdateReply &&
                      onDeleteReply &&
                      currentUserId === reply.createdBy?.id &&
                      !question.isResolved && (
                        <div className={styles.replyActions}>
                          <button
                            className={styles.editReplyButton}
                            onClick={() => setEditingReplyId(reply.id)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.deleteReplyButton}
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!question.isResolved && (
        <div className={styles.addReplyContainer}>
          {creatingReplyForQuestion === question.id ? (
            <TipTapEditor
              onSubmit={(content) => onCreateReply(question.id, content)}
              onCancel={() => setCreatingReplyForQuestion(null)}
              users={users}
              aiOptimizeAction="optimizeText"
            />
          ) : (
            <button
              className={styles.addReplyButton}
              onClick={() => setCreatingReplyForQuestion(question.id)}
            >
              + Add a reply
            </button>
          )}
        </div>
      )}

      {renderMessagesModal()}
    </div>
  );
}

export default QuestionItem;
