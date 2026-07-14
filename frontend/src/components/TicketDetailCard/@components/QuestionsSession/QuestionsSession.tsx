import React, { useEffect, useState } from 'react';
import { JSONContent } from '@tiptap/core';
import {
  getQuestionsByTicket,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../../../../api/question/question';
import { createReply, updateReply, deleteReply } from '../../../../api/reply/reply';
import { IQuestion } from '../../../../api/question/entity/question';
import { IUserInfo } from '../../../../types';
import checkAccess from '../../../../utils/helpers';
import TipTapEditor from '../../../TipTapEditor/TipTapEditor';
import QuestionItem from '../../../QuestionItem/QuestionItem';
import { Permission } from '../../../../utils/permission';

interface IQuestionsSessionProps {
  userId?: string;
  users: IUserInfo[];
  ticketId?: string;
  projectId: string;
}

function QuestionsSession(Props: IQuestionsSessionProps) {
  const { ticketId = '', users = [], projectId = '', userId = '' } = Props;
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [creatingReplyForQuestion, setCreatingReplyForQuestion] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const extractTextFromContent = (content: JSONContent): string => {
    if (!content.content) return '';
    return content.content
      .map((node: any) => {
        if (node.type === 'text') return node.text || '';
        if (node.content) return extractTextFromContent(node);
        return '';
      })
      .join(' ')
      .trim()
      .substring(0, 200);
  };

  const fetchQuestions = async () => {
    if (!ticketId) return;
    try {
      const result = await getQuestionsByTicket(ticketId);
      const questionsData = result?.data || [];
      setQuestions(questionsData);
    } catch (error) {
      setQuestions([]);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [ticketId]);

  const handleCreateQuestion = async (content: JSONContent) => {
    try {
      const title = extractTextFromContent(content);
      await createQuestion({
        title: title || 'Untitled Question',
        ticket: ticketId,
        assignee: 'automatic'
        // Priority will be automatically set to 'Highest' by backend if ticket is in active sprint
      });

      setIsCreatingQuestion(false);
      await fetchQuestions();
    } catch (error) {
      setIsCreatingQuestion(false);
    }
  };

  const handleCreateReply = async (questionId: string, content: JSONContent) => {
    try {
      const stringifiedContent = JSON.stringify(content);
      await createReply({
        question: questionId,
        content: stringifiedContent
      });
      setCreatingReplyForQuestion(null);
      await fetchQuestions();
    } catch (error) {
      setCreatingReplyForQuestion(null);
    }
  };

  const toggleQuestionExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleToggleWaitingForStakeholder = async (questionId: string, currentStatus: boolean) => {
    try {
      await updateQuestion(questionId, { waitingForStakeholder: !currentStatus });
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleToggleResolved = async (questionId: string, currentStatus: boolean) => {
    try {
      await updateQuestion(questionId, { isResolved: !currentStatus });
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleUpdatePriority = async (questionId: string, priority: string) => {
    try {
      await updateQuestion(questionId, {
        priority: priority as 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest'
      });
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleUpdateAssignee = async (questionId: string, assigneeId: string | null) => {
    try {
      await updateQuestion(questionId, { assignee: assigneeId });
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleUpdateReply = async (replyId: string, content: JSONContent) => {
    try {
      const stringifiedContent = JSON.stringify(content);
      await updateReply(replyId, { content: stringifiedContent });
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId);
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleUpdateQuestion = async (questionId: string, title: string) => {
    try {
      await updateQuestion(questionId, { title });
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(questionId);
      await fetchQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  return (
    <div className="p-0 mt-3 mb-3">
      <h4 className="text-xs font-semibold m-0 mb-3 uppercase tracking-wide">
        Questions/Confirmation
      </h4>
      <h5 className="text-sm font-medium m-0 mb-4 text-secondary opacity-50">
        Any questions or requirements confirmation should be documented here.
      </h5>
      {checkAccess(Permission.AddComments, projectId) && (
        <div className="mb-5">
          {isCreatingQuestion ? (
            <TipTapEditor
              onSubmit={handleCreateQuestion}
              onCancel={() => setIsCreatingQuestion(false)}
              users={users}
              aiOptimizeAction="optimizeText"
            />
          ) : (
            <button
              className="flex items-center justify-center border border-dashed border-light rounded-md bg-white px-5 py-3 w-full cursor-pointer transition-all font-medium text-secondary hover-border-primary hover-text-primary hover-bg-gray-50"
              style={{ fontSize: '15px' }}
              onClick={() => setIsCreatingQuestion(true)}
            >
              + Add
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {questions &&
          questions.length > 0 &&
          questions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              replies={question.replies || []}
              isExpanded={expandedQuestions.has(question.id)}
              onToggleExpanded={toggleQuestionExpanded}
              onToggleWaitingForStakeholder={handleToggleWaitingForStakeholder}
              onToggleResolved={handleToggleResolved}
              onUpdatePriority={handleUpdatePriority}
              onUpdateAssignee={handleUpdateAssignee}
              onUpdateQuestion={handleUpdateQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onCreateReply={handleCreateReply}
              onUpdateReply={handleUpdateReply}
              onDeleteReply={handleDeleteReply}
              creatingReplyForQuestion={creatingReplyForQuestion}
              setCreatingReplyForQuestion={setCreatingReplyForQuestion}
              users={users}
              showTicketInfo={false}
              currentUserId={userId}
            />
          ))}
      </div>
    </div>
  );
}

export default QuestionsSession;
