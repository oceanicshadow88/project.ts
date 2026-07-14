import React, { useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { ModalContext } from '../../../../context/ModalProvider';
import ButtonV2 from '../../../../lib/FormV2/ButtonV2/ButtonV2';
import Modal from '../../../../lib/Modal/Modal';
import { IQuestion } from '../../../../api/question/entity/question';

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

interface SendToPOModalProps {
  questions: QuestionWithTicket[];
  onSend: (email: string, selectedQuestionIds: string[]) => Promise<void>;
}

export default function SendToPOModal({ questions, onSend }: SendToPOModalProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { closeModal } = useContext(ModalContext);

  const handleSend = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address', { theme: 'colored' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address', { theme: 'colored' });
      return;
    }

    try {
      setIsSending(true);
      const allQuestionIds = questions.map((q) => q.id);
      await onSend(email, allQuestionIds);
      closeModal('send-all-questions-to-po');
    } catch (error) {
      toast.error('Failed to send questions to Product Owner', { theme: 'colored' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal>
      <div className="p-6">
        <h2 className="m-0 mb-4 font-semibold text-lg">Send to Product Owner</h2>
        <p className="mb-4 text-sm text-gray-700">
          Sending all {questions.length} question{questions.length !== 1 ? 's' : ''} to the Product
          Owner. All questions will be marked as &quot;Awaiting PO&quot;.
        </p>

        <div className="mb-4">
          <label htmlFor="po-email-input" className="block mb-2 text-sm font-medium text-gray-700">
            Email Address
            <input
              id="po-email-input"
              type="email"
              placeholder="Enter Product Owner email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-light rounded-md text-sm focus:border-primary focus:outline-none mt-2"
              disabled={isSending}
            />
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <ButtonV2
            text="Cancel"
            onClick={() => closeModal('send-all-questions-to-po')}
            disabled={isSending}
          />
          <ButtonV2
            text={isSending ? 'Sending...' : 'Send'}
            fill
            onClick={handleSend}
            disabled={isSending}
          />
        </div>
      </div>
    </Modal>
  );
}
