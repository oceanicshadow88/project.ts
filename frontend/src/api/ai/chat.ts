import { ITicketInput } from '../../types';
import { AiChatProject, AiChatReply, AiChatRequest, SavedTicket } from '../../types/aiChat';
import { mockCreateTicket, mockSendAiChat } from './mockChat';

// TS-37 M1 only: the mock stands in for the backend. Delete this flag and mockChat.ts in M2
export const USE_AI_CHAT_MOCK = true;

// Replaced by the Chat API and POST /tickets when the backend is connected (TS-37 M2)
const notConnected = () => Promise.reject(new Error('The AI chat backend is not connected yet'));

export function sendAiChat(
  projectId: string,
  request: AiChatRequest,
  project: AiChatProject
): Promise<AiChatReply> {
  return USE_AI_CHAT_MOCK ? mockSendAiChat(request.message, project) : notConnected();
}

export function createTicketFromDraft(input: ITicketInput): Promise<SavedTicket> {
  return USE_AI_CHAT_MOCK ? mockCreateTicket(input) : notConnected();
}
