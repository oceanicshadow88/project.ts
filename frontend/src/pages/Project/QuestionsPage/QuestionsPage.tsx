import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { JSONContent } from '@tiptap/core';
import { IQuestion } from '../../../api/question/entity/question';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import {
  getQuestionsByProject,
  updateQuestion,
  deleteQuestion,
  sendQuestionsToPO
} from '../../../api/question/question';
import { IReply } from '../../../api/reply/entity/reply';
import { createReply, updateReply, deleteReply } from '../../../api/reply/reply';
import { IUserInfo } from '../../../types';
import { ProjectDetailsContext } from '../../../context/ProjectDetailsProvider';
import { UserContext } from '../../../context/UserInfoProvider';
import { ModalContext } from '../../../context/ModalProvider';
import ProjectHOC from '../../../components/HOC/ProjectHOC';
import QuestionItem from '../../../components/QuestionItem/QuestionItem';
import SendToPOModal from '../../../components/QuestionItem/components/SendToPOModal/SendToPOModal';
import ButtonV2 from '../../../lib/FormV2/ButtonV2/ButtonV2';
import styles from './QuestionsPage.module.scss';

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
  replies?: IReply[];
}

function QuestionsPage() {
  const { projectId } = useParams();
  const projectDetails = useContext(ProjectDetailsContext);
  const currentUser = useContext(UserContext);
  const { showModal } = useContext(ModalContext);
  const [questions, setQuestions] = useState<QuestionWithTicket[]>([]);
  const [showResolvedQuestions, setShowResolvedQuestions] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [creatingReplyForQuestion, setCreatingReplyForQuestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const users: IUserInfo[] = projectDetails.users || [];

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!projectId) return;
      try {
        setIsLoading(true);
        const result = await getQuestionsByProject(projectId);
        const questionsData = (result?.data || []) as QuestionWithTicket[];
        // Sort by createdAt (oldest first)
        questionsData.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        // Filter questions based on showResolvedQuestions state
        const filteredQuestions = showResolvedQuestions
          ? questionsData
          : questionsData.filter((q) => !q.isResolved);
        setQuestions(filteredQuestions);
      } catch (error) {
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [projectId, showResolvedQuestions]);

  const refreshQuestions = async () => {
    if (!projectId) return;
    try {
      const result = await getQuestionsByProject(projectId);
      const questionsData = (result?.data || []) as QuestionWithTicket[];
      questionsData.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });
      // Filter questions based on showResolvedQuestions state
      const filteredQuestions = showResolvedQuestions
        ? questionsData
        : questionsData.filter((q) => !q.isResolved);
      setQuestions(filteredQuestions);
    } catch (error) {
      // Error handled silently
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
      // Refresh questions to get updated replies
      await refreshQuestions();
    } catch (error) {
      setCreatingReplyForQuestion(null);
    }
  };

  const handleUpdateReply = async (replyId: string, content: JSONContent) => {
    try {
      const stringifiedContent = JSON.stringify(content);
      await updateReply(replyId, { content: stringifiedContent });
      // Refresh questions to get updated replies
      await refreshQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId);
      // Refresh questions to get updated replies
      await refreshQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleToggleWaitingForStakeholder = async (questionId: string, currentStatus: boolean) => {
    try {
      await updateQuestion(questionId, { waitingForStakeholder: !currentStatus });
      await refreshQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleUpdateQuestion = async (questionId: string, title: string) => {
    try {
      await updateQuestion(questionId, { title });
      await refreshQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await deleteQuestion(questionId);
      await refreshQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleToggleResolved = async (questionId: string, currentStatus: boolean) => {
    try {
      await updateQuestion(questionId, { isResolved: !currentStatus });
      await refreshQuestions();
    } catch (error) {
      // Error handled silently
    }
  };

  const handleSendToPO = async (email: string, selectedQuestionIds: string[]) => {
    try {
      await sendQuestionsToPO(projectId || '', email, selectedQuestionIds);
      // Refresh questions to get updated waitingForStakeholder status
      await refreshQuestions();
      // eslint-disable-next-line no-alert
      toast.success('Questions sent to Product Owner successfully', {
        theme: 'colored',
        className: 'primaryColorBackground'
      });
    } catch (error) {
      // eslint-disable-next-line no-alert
      toast.error('Failed to send questions to Product Owner', { theme: 'colored' });
      throw error;
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

  // Group questions by sprint
  const currentSprintQuestions = questions.filter((q) => {
    if (typeof q.ticket === 'string') return false;
    return q.ticket.sprint?.status === 'active';
  });

  const planningSprintQuestions = questions.filter((q) => {
    if (typeof q.ticket === 'string') return false;
    const { sprint } = q.ticket;
    if (!sprint) return false;
    return sprint.status === 'planning';
  });

  const otherQuestions = questions.filter((q) => {
    if (typeof q.ticket === 'string') return false;
    const { sprint } = q.ticket;
    // Questions without a sprint or with completed sprint or other statuses
    return (
      !sprint ||
      sprint.status === 'completed' ||
      (sprint.status !== 'active' && sprint.status !== 'planning')
    );
  });

  if (isLoading) {
    return (
      <ProjectHOC title="Questions">
        <div className={styles.loading}>Loading questions...</div>
      </ProjectHOC>
    );
  }

  return (
    <ProjectHOC title="Questions">
      {/* Filter Controls */}
      <div className={styles.filterControls}>
        <label htmlFor="showResolvedCheckbox" className={styles.checkboxLabel}>
          <input
            id="showResolvedCheckbox"
            type="checkbox"
            checked={showResolvedQuestions}
            onChange={(e) => setShowResolvedQuestions(e.target.checked)}
            className={styles.checkbox}
          />
          Show resolved questions
        </label>
      </div>

      {questions.length > 0 && (
        <div className={`${styles.sendToPOButtonContainer} mb-4 mt-4`}>
          <ButtonV2
            text="Send Email"
            fill
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              showModal(
                'send-all-questions-to-po',
                <SendToPOModal questions={questions} onSend={handleSendToPO} />
              );
            }}
          />
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.section}>
          <SectionTitle count={currentSprintQuestions.length} countLabel="questions" withBorder>
            Current Sprint
          </SectionTitle>
          {currentSprintQuestions.length === 0 ? (
            <p className={styles.emptyMessage}>No questions in current sprint</p>
          ) : (
            <div className={styles.questionsList}>
              {currentSprintQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  replies={question.replies || []}
                  isExpanded={expandedQuestions.has(question.id)}
                  onToggleExpanded={toggleQuestionExpanded}
                  onToggleWaitingForStakeholder={handleToggleWaitingForStakeholder}
                  onToggleResolved={handleToggleResolved}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onCreateReply={handleCreateReply}
                  onUpdateReply={handleUpdateReply}
                  onDeleteReply={handleDeleteReply}
                  creatingReplyForQuestion={creatingReplyForQuestion}
                  setCreatingReplyForQuestion={setCreatingReplyForQuestion}
                  users={users}
                  showTicketInfo
                  currentUserId={currentUser.id}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <SectionTitle count={planningSprintQuestions.length} withBorder>
            Planning Sprint
          </SectionTitle>
          {planningSprintQuestions.length === 0 ? (
            <p className={styles.emptyMessage}>No questions in planning sprints</p>
          ) : (
            <div className={styles.questionsList}>
              {planningSprintQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  replies={question.replies || []}
                  isExpanded={expandedQuestions.has(question.id)}
                  onToggleExpanded={toggleQuestionExpanded}
                  onToggleWaitingForStakeholder={handleToggleWaitingForStakeholder}
                  onToggleResolved={handleToggleResolved}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onCreateReply={handleCreateReply}
                  onUpdateReply={handleUpdateReply}
                  onDeleteReply={handleDeleteReply}
                  creatingReplyForQuestion={creatingReplyForQuestion}
                  setCreatingReplyForQuestion={setCreatingReplyForQuestion}
                  users={users}
                  showTicketInfo
                  currentUserId={currentUser.id}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.section}>
          <SectionTitle count={otherQuestions.length} countLabel="questions" withBorder>
            Other
          </SectionTitle>
          {otherQuestions.length === 0 ? (
            <p className={styles.emptyMessage}>No questions in other sprints or without sprint</p>
          ) : (
            <div className={styles.questionsList}>
              {otherQuestions.map((question) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  replies={question.replies || []}
                  isExpanded={expandedQuestions.has(question.id)}
                  onToggleExpanded={toggleQuestionExpanded}
                  onToggleWaitingForStakeholder={handleToggleWaitingForStakeholder}
                  onToggleResolved={handleToggleResolved}
                  onUpdateQuestion={handleUpdateQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onCreateReply={handleCreateReply}
                  onUpdateReply={handleUpdateReply}
                  onDeleteReply={handleDeleteReply}
                  creatingReplyForQuestion={creatingReplyForQuestion}
                  setCreatingReplyForQuestion={setCreatingReplyForQuestion}
                  users={users}
                  showTicketInfo
                  currentUserId={currentUser.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProjectHOC>
  );
}

export default QuestionsPage;
