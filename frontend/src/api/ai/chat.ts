import { alphaApiV2 } from '../../config/api';
import { ITicketInput } from '../../types';
import { AiChatReply, AiChatRequest, SavedTicket } from '../../types/aiChat';
import { createNewTicket } from '../ticket/ticket';

// A little longer than the backend's 25 second limit for Claude, so the backend answers first
const CHAT_TIMEOUT_MS = 30000;

export function sendAiChat(projectId: string, request: AiChatRequest): Promise<AiChatReply> {
  return alphaApiV2
    .post<AiChatReply>(`/projects/${projectId}/ai/chat`, request, { timeout: CHAT_TIMEOUT_MS })
    .then((res) => res.data);
}

// The confirmed draft goes through the same POST /tickets as the rest of the app
export function createTicketFromDraft(input: ITicketInput): Promise<SavedTicket> {
  return createNewTicket(input).then((res) => res.data);
}
