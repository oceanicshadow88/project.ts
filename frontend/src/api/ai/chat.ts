import config from '../../config/config';
import { ITicketInput } from '../../types';
import { AiChatProject, AiChatReply, AiChatRequest, SavedTicket } from '../../types/aiChat';
import { mockCreateTicket, mockSendAiChat } from './mockChat';

// Replaced by the Chat API and POST /tickets when the backend is connected (TS-37 M2)
const notConnected = () => Promise.reject(new Error('The AI chat backend is not connected yet'));

export function sendAiChat(
  projectId: string,
  request: AiChatRequest,
  project: AiChatProject
): Promise<AiChatReply> {
  return config.aiChatMock ? mockSendAiChat(request.message, project) : notConnected();
}

export function createTicketFromDraft(input: ITicketInput): Promise<SavedTicket> {
  return config.aiChatMock ? mockCreateTicket(input) : notConnected();
}
