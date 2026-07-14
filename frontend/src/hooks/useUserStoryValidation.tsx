import React, { useContext, useState } from 'react';
import {
  createNewTicket,
  generateUserStory,
  updateTicket,
  validateUserStory
} from '../api/ticket/ticket';
import { FeedbackQuestion, ITicketInput, UserStoryValidationResponse } from '../types';

import { ModalContext } from '../context/ModalProvider';
import UserStoryFeedbackModal from '../components/UserStoryFeedbackModal/UserStoryFeedbackModal';

export interface UseUserStoryValidationResult {
  validateAndCreateIssue: (
    data: ITicketInput,
    onTicketCreateSuccess: () => void
  ) => Promise<boolean>;
  validateAndUpdateIssue: (
    id: string,
    data: ITicketInput,
    onTicketUpdateSuccess: () => void
  ) => Promise<boolean>;
}

export function useUserStoryValidation(): UseUserStoryValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [pendingIssueData, setPendingIssueData] = useState<ITicketInput | null>(null);
  const { showModal, closeModal } = useContext(ModalContext);

  const clearFeedbackModal = () => {
    setPendingIssueData(null);
  };

  const submitFeedback = async (title: string, answers: FeedbackQuestion[]) => {
    // For now, just create the ticket with the feedback collected
    // In the future, you might want to send the feedback to improve the AI
    // eslint-disable-next-line no-console
    console.log('User feedback:', answers);
    const result = await generateUserStory(title, answers);

    const ticketData: ITicketInput = {
      ...pendingIssueData,
      ...{
        title,
        description: JSON.stringify(result.data.tipTapContent)
        // Include any other necessary fields for the ticket
      }
    };
    return ticketData;
  };

  const validateAndCreateIssue = async (data: ITicketInput, onTicketCreateSuccess: () => void) => {
    await createNewTicket(data);
    onTicketCreateSuccess();
    return true;
    try {
      setIsValidating(true);

      const response = await validateUserStory(data.title);
      const validationData: UserStoryValidationResponse = response.data;

      const titlePassed = validationData.structured.title.state === 'pass';
      const descriptionPassed = validationData.structured.description.state === 'pass';

      if (titlePassed && descriptionPassed) {
        const ticketData: ITicketInput = {
          ...data,
          description: JSON.stringify(validationData.tipTapContent)
        };
        await createNewTicket(ticketData);
        onTicketCreateSuccess();
        return true;
      }
      // Collect feedback questions only for failed validations
      const questions: string[] = [];

      if (!titlePassed && Array.isArray(validationData.structured.title.feedback)) {
        questions.push(...validationData.structured.title.feedback);
      }

      // Only add description feedback if description exists and failed
      if (!descriptionPassed) {
        if (Array.isArray(validationData.structured.description.feedback)) {
          questions.push(...validationData.structured.description.feedback);
        }
      }

      setPendingIssueData({ ...data, description: JSON.stringify(validationData.tipTapContent) });

      showModal(
        'feedback-modal',
        <UserStoryFeedbackModal
          onClose={() => closeModal('feedback-modal')}
          questions={questions ?? []}
          title={validationData.title}
          onSubmit={async (answer: FeedbackQuestion[]) => {
            const ticketData = await submitFeedback(validationData.title, answer);
            await createNewTicket(ticketData);
            onTicketCreateSuccess();
            clearFeedbackModal();
            closeModal('feedback-modal');
          }}
          loading={isValidating}
        />
      );

      return false;
    } catch (error) {
      // If validation fails, create ticket anyway
      // eslint-disable-next-line no-console
      console.warn('User story validation failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const validateAndUpdateIssue = async (
    id: string,
    data: ITicketInput,
    onTicketUpdateSuccess: () => void
  ) => {
    try {
      setIsValidating(true);

      const response = await validateUserStory(data.title);
      const validationData: UserStoryValidationResponse = response.data;

      const titlePassed = validationData.structured.title.state === 'pass';
      const descriptionPassed = validationData.structured.description.state === 'pass';

      if (titlePassed && descriptionPassed) {
        const ticketData: ITicketInput = {
          ...data,
          description: JSON.stringify(validationData.tipTapContent)
        };
        await updateTicket(id, ticketData);
        onTicketUpdateSuccess();
        return true;
      }
      // Collect feedback questions only for failed validations
      const questions: string[] = [];

      if (!titlePassed && Array.isArray(validationData.structured.title.feedback)) {
        questions.push(...validationData.structured.title.feedback);
      }

      // Only add description feedback if description exists and failed
      if (!descriptionPassed) {
        if (Array.isArray(validationData.structured.description.feedback)) {
          questions.push(...validationData.structured.description.feedback);
        }
      }

      setPendingIssueData({ ...data, description: JSON.stringify(validationData.tipTapContent) });

      showModal(
        'feedback-modal',
        <UserStoryFeedbackModal
          onClose={() => closeModal('feedback-modal')}
          questions={questions ?? []}
          title={validationData.title}
          onSubmit={async (answer: FeedbackQuestion[]) => {
            const ticketData = await submitFeedback(validationData.title, answer);
            await updateTicket(id, ticketData);
            clearFeedbackModal();
            onTicketUpdateSuccess();
            closeModal('feedback-modal');
          }}
          loading={isValidating}
        />
      );

      return false;
    } catch (error) {
      // If validation fails, create ticket anyway
      // eslint-disable-next-line no-console
      console.warn('User story validation failed:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateAndCreateIssue,
    validateAndUpdateIssue
  };
}
