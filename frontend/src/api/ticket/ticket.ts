import config from '../../config/config';
import { alphaApiV2 } from '../../config/api';
import { FeedbackQuestion, ISprintTicket, ITicketInput } from '../../types';

export function validateUserStory(title: string) {
  return alphaApiV2.post(
    `${config.kScrumAddress}/ee/user-story`,
    {
      title
    },
    {
      headers: {
        'api-token': config.apiKToken
      }
    }
  );
}

export function generateUserStory(title: string, answers: FeedbackQuestion[]) {
  return alphaApiV2.post(
    `${config.kScrumAddress}/ee/genereate-user-story`,
    {
      title,
      answers
    },
    {
      headers: {
        'api-token': config.apiKToken
      }
    }
  );
}

export function getTickets() {
  return alphaApiV2.get(`${config.apiAddressV2}/projects`);
}

export function getTicketsByProject(projectId: string) {
  return alphaApiV2.get(`/tickets/project/${projectId}`);
}

export function showTicket(id: string) {
  return alphaApiV2.get(`${config.apiAddressV2}/tickets/${id}`);
}

export function deleteTicket(id: string) {
  return alphaApiV2.delete(`/tickets/${id}`);
}

export function deactiveTicket(id: string) {
  return alphaApiV2.put(`/tickets/${id}/toggleActive`);
}

export function createNewTicket(data: ITicketInput | ISprintTicket) {
  return alphaApiV2.post(`/tickets`, data);
}

export function fetchTicket(id: string) {
  return alphaApiV2.get(`${config.apiAddressV2}/tickets/${id}`);
}

export function updateTicket(id: string, data: any) {
  const copyData = structuredClone(data);
  if (data.assign && typeof data.assign !== 'string') {
    copyData.assign = data.assign ? data.assign.id : null;
  }
  if (typeof data.status !== 'string' && data.status) {
    copyData.status = data.status === null ? null : data?.status?.id;
  }
  if (typeof data.reporter !== 'string') {
    copyData.reporter = data?.reporter?.id;
  }

  if (typeof data.type !== 'string') {
    copyData.type = data?.type?.id;
  }
  if (typeof data.project !== 'string') {
    copyData.project = data?.project?.id;
  }

  return alphaApiV2.put(`${config.apiAddressV2}/tickets/${id}`, copyData);
}

export function updateTicketSprint(ticketId: string, sprintId?: string | null, data?: any) {
  return alphaApiV2.put(`${config.apiAddressV2}/tickets/${ticketId}`, {
    sprint: sprintId,
    ...data
  });
}

export function updateTicketEpic(ticketId: string, epic?: string | null) {
  return alphaApiV2.put(`${config.apiAddressV2}/tickets/${ticketId}`, { epic });
}

export function updateTicketStatus(ticketId: string, statusId: string, rank?: string) {
  const updateData: any = { status: statusId };
  if (rank) {
    updateData.rank = rank;
  }
  return alphaApiV2.put(`${config.apiAddressV2}/tickets/${ticketId}`, updateData);
}

export function batchUpdateTicketRanks(updates: Array<{ ticketId: string; rank: string }>) {
  return alphaApiV2.put(`${config.apiAddressV2}/tickets/batch-update-ranks`, { updates });
}

export function removeTicket(id: string) {
  return alphaApiV2.delete(`${config.apiAddressV2}/tickets/${id}`);
}

export function migrateTicketRanks(projectId: string) {
  return alphaApiV2.post(`${config.apiAddressV2}/tickets/migrate-ranks`, { projectId });
}
