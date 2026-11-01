import config from '../../config/config';
import { AiChatProject, AiChatReply, CreatedTicket, TicketDraft } from './entity/chat';
import { mockCreateTicketFromDraft, mockSendAiChat } from './mockChat';

// Replaced by the Chat API and POST /tickets when the backend is connected (TS-37 M2)
const notConnected = () => Promise.reject(new Error('The AI chat backend is not connected yet'));

export function sendAiChat(
  projectId: string,
  message: string,
  project: AiChatProject
): Promise<AiChatReply> {
  return config.aiChatMock ? mockSendAiChat(message, project) : notConnected();
}

export function createTicketFromDraft(
  projectId: string,
  draft: TicketDraft,
  project: AiChatProject
): Promise<CreatedTicket> {
  return config.aiChatMock ? mockCreateTicketFromDraft(draft, project) : notConnected();
}
