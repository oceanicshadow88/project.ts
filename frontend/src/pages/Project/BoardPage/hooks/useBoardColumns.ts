import { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { addStatusToBoard, reorderBoardStatuses } from '../../../../api/board/board';
import { IBoard } from '../../../../types';

// Holds the selected board and saves column (status) reorders and new columns
export default function useBoardColumns(projectId: string, onUpdateBoard: (board: IBoard) => void) {
  const [boardDetails, setBoardDetails] = useState<IBoard>();

  const onColumnDrop = (dropResult: DropResult) => {
    const { source, destination } = dropResult;
    if (!boardDetails || !destination || destination.index === source.index) {
      return;
    }

    const previousBoard = boardDetails;
    const statuses = [...boardDetails.statuses];
    const [movedStatus] = statuses.splice(source.index, 1);
    statuses.splice(destination.index, 0, movedStatus);
    setBoardDetails({ ...boardDetails, statuses });

    reorderBoardStatuses(
      boardDetails.id,
      projectId,
      statuses.map((status) => status.id)
    )
      .then((updatedBoard) => onUpdateBoard(updatedBoard))
      // Put the old order back if saving fails
      .catch(() => setBoardDetails(previousBoard));
  };

  const onAddColumn = async (name: string) => {
    if (!boardDetails) {
      return;
    }
    const updatedBoard = await addStatusToBoard(boardDetails.id, projectId, name);
    setBoardDetails(updatedBoard);
    onUpdateBoard(updatedBoard);
  };

  return { boardDetails, setBoardDetails, onColumnDrop, onAddColumn };
}
