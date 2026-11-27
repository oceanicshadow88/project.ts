import { Dispatch, SetStateAction } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { createNewTicket, updateTicketStatus } from '../../../../api/ticket/ticket';
import { ISprintTicket } from '../../../../types';
import { generateKeyBetween, customCompare } from '../../../../utils/lexoRank';

const getNewGlobalRank = (
  destinationIndex: number,
  allTicketsSorted: ISprintTicket[],
  destinationTickets: ISprintTicket[]
): string => {
  const lastTicketInColumnIndex = destinationTickets.length - 1;
  const lastTicketGlobalIndex = allTicketsSorted.length - 1;
  if (lastTicketGlobalIndex < 0) {
    return generateKeyBetween(null, null);
  }
  const nextTicketInColumn =
    lastTicketInColumnIndex >= destinationIndex ? destinationTickets[destinationIndex] : undefined;

  let prev: string | null = null;
  let after: string | null = null;
  if (nextTicketInColumn) {
    // find the most nearest ticket that smaller than this nextTicketInColumn
    const nextTicketInColumnGlobalIndex = allTicketsSorted.findIndex(
      (ticket) => ticket.rank === nextTicketInColumn.rank
    );
    if (nextTicketInColumnGlobalIndex !== undefined) {
      after = nextTicketInColumn.rank ?? null;
      if (nextTicketInColumnGlobalIndex - 1 >= 0) {
        const nearestSmallerRankTicket = allTicketsSorted[nextTicketInColumnGlobalIndex - 1];
        prev = nearestSmallerRankTicket.rank ?? null;
      }
    }
  } else {
    // get the greatest rank
    const greatestRankTicket = allTicketsSorted[lastTicketGlobalIndex];
    prev = greatestRankTicket?.rank ?? null;
  }
  return generateKeyBetween(prev, after);
};

// Gives new and moved tickets a lexo rank so the board keeps their order
export default function useTicketRanking(
  tickets: ISprintTicket[],
  setTickets: Dispatch<SetStateAction<ISprintTicket[]>>
) {
  const onTicketCreate = async (newTicket: ISprintTicket) => {
    const allTicketsSorted = tickets.sort((a, b) => customCompare(a?.rank, b?.rank));

    const newRank =
      allTicketsSorted.length > 0
        ? generateKeyBetween(allTicketsSorted[allTicketsSorted.length - 1]?.rank, null)
        : generateKeyBetween(null, null);

    const res = await createNewTicket({ ...newTicket, rank: newRank });
    setTickets([...tickets, res.data]);
  };

  const onTicketDrop = async (dropResult: DropResult) => {
    const { destination, source, draggableId: currentTicketId } = dropResult;
    if (!destination) {
      return;
    }

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const currentTicket = tickets.find((item) => item.id === currentTicketId);
    if (!currentTicket) {
      return;
    }

    const allTicketsSorted = tickets
      .filter((t) => t.id !== currentTicketId)
      .sort((a, b) => customCompare(a?.rank, b?.rank));

    const destinationTicketsSorted = allTicketsSorted.filter(
      (t) => t.status === destination.droppableId
    );

    const newRank = getNewGlobalRank(destination.index, allTicketsSorted, destinationTicketsSorted);

    const updatedTicket = {
      ...currentTicket,
      status: destination.droppableId,
      rank: newRank
    };

    setTickets(tickets.map((item) => (item.id === currentTicketId ? updatedTicket : item)));
    await updateTicketStatus(currentTicketId, destination.droppableId, newRank);
  };

  return { onTicketCreate, onTicketDrop };
}
