import React, { useState } from 'react';
import { FeedbackQuestion } from '../../types';
import style from './UserStoryFeedbackModal.module.scss';

interface UserStoryFeedbackModalProps {
  readonly onClose: () => void;
  readonly questions: string[];
  readonly title: string;
  readonly onSubmit: (answers: FeedbackQuestion[]) => void;
  readonly loading?: boolean;
}

export default function UserStoryFeedbackModal({
  onClose,
  questions,
  title,
  onSubmit,
  loading = false
}: UserStoryFeedbackModalProps) {
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = () => {
    const feedbackQuestions: FeedbackQuestion[] = questions.map((question, index) => ({
      question,
      answer: answers[index] || ''
    }));
    onSubmit(feedbackQuestions);
  };

  const canSubmit = questions.every(
    (_, index) => answers[index] && answers[index].trim().length > 0
  );

  return (
    <div className={style.modalOverlay}>
      <div className={style.modal}>
        <div className={style.modalHeader}>
          <h3>User Story Feedback Required</h3>
          <button type="button" className={style.closeButton} onClick={onClose} disabled={loading}>
            ×
          </button>
        </div>

        <div className={style.modalBody}>
          <div className={style.content}>
            <h5 className={style.ticketTitle}>{title}</h5>
            <p className={style.description}>
              Please provide more context to improve the user story quality:
            </p>

            <div className={style.questionsContainer}>
              {questions.map((question, index) => {
                const questionId = `question-${question.substring(0, 20).replaceAll(/\s+/g, '-')}`;
                return (
                  <div key={questionId} className={style.questionRow}>
                    <label htmlFor={questionId} className={style.questionLabel}>
                      {index + 1}. {question}
                    </label>
                    <textarea
                      id={questionId}
                      className={style.answerInput}
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Enter your answer..."
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={style.modalFooter}>
          <button type="button" className={style.cancelButton} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            className={style.submitButton}
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
          >
            {loading ? 'Processing...' : 'Submit Answers'}
          </button>
        </div>
      </div>
    </div>
  );
}
