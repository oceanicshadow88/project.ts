import { alphaApiV2 } from '../../config/api';
import { CreateQuestion, UpdateQuestion, IQuestion } from './entity/question';

export function getQuestionsByTicket(ticketId: string) {
  return alphaApiV2.get<IQuestion[]>(`/tickets/${ticketId}/questions`);
}

export function getQuestionsByProject(projectId: string) {
  return alphaApiV2.get<IQuestion[]>(`/projects/${projectId}/questions`);
}

export function getQuestionsForPOReply(projectId: string) {
  return alphaApiV2.get<IQuestion[]>(`/projects/${projectId}/questions/po-reply`);
}

export function getQuestionById(id: string) {
  return alphaApiV2.get<IQuestion>(`/questions/${id}`);
}

export function createQuestion(data: CreateQuestion) {
  return alphaApiV2.post<IQuestion>(`/questions`, data);
}

export function updateQuestion(id: string, data: UpdateQuestion) {
  return alphaApiV2.put<IQuestion>(`/questions/${id}`, data);
}

export function deleteQuestion(id: string) {
  return alphaApiV2.delete(`/questions/${id}`);
}

export function sendQuestionsToPO(projectId: string, email: string, questionIds: string[]) {
  return alphaApiV2.post(`/projects/${projectId}/questions/send-to-po`, { email, questionIds });
}
