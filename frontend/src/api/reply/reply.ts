import { alphaApiV2 } from '../../config/api';
import { CreateReply, UpdateReply, IReply } from './entity/reply';

export function getRepliesByQuestion(questionId: string) {
  return alphaApiV2.get<IReply[]>(`/questions/${questionId}/replies`);
}

export function createReply(data: CreateReply) {
  return alphaApiV2.post<IReply>(`/replies`, data);
}

export function updateReply(id: string, data: UpdateReply) {
  return alphaApiV2.put<IReply>(`/replies/${id}`, data);
}

export function deleteReply(id: string) {
  return alphaApiV2.delete(`/replies/${id}`);
}
