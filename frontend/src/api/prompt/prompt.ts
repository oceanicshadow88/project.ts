import { alphaApiV2 } from '../../config/api';
import { CreatePrompt, UpdatePrompt, IPrompt, PromptsListResponse } from './entity/prompt';

export function getPrompts() {
  return alphaApiV2.get<PromptsListResponse>('/prompts');
}

export function getPromptById(id: string) {
  return alphaApiV2.get<IPrompt>(`/prompts/${id}`);
}

export function createPrompt(data: CreatePrompt) {
  return alphaApiV2.post<IPrompt>('/prompts', data);
}

export function updatePrompt(id: string, data: UpdatePrompt) {
  return alphaApiV2.put<IPrompt>(`/prompts/${id}`, data);
}

export function deletePrompt(id: string) {
  return alphaApiV2.delete(`/prompts/${id}`);
}
