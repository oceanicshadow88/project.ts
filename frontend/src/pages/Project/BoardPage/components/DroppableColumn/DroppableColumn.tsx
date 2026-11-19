/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Droppable, Draggable, DraggableProvided } from 'react-beautiful-dnd';
import checkAccess from '../../../../../utils/helpers';
import styles from './DroppableColumn.module.scss';

interface IDroppableColumn {
  name: string;
  id: string;
  projectId: string;
  createBtn: React.ReactNode;
  children: React.ReactNode;
  totalTicket: number;
  sprintId: string;
  index?: number;
}

export default function DroppableColumn(props: IDroppableColumn) {
  const { name, id, projectId, children, totalTicket, createBtn, index } = props;

  const renderColumn = (dragProvided?: DraggableProvided) => (
    <div
      ref={dragProvided?.innerRef}
      {...dragProvided?.draggableProps}
      className={styles.columnsContainer}
      data-testid={`board-col-${id}`}
    >
      <div className={styles.columnInfo} {...dragProvided?.dragHandleProps}>
        <h1 className={styles.name}>{name}</h1>
        <h1 className={styles.num}>{totalTicket}</h1>
      </div>
      <Droppable droppableId={id} key={id}>
        {(provided) => {
          return (
            <div ref={provided.innerRef} {...provided.droppableProps} className={styles.column}>
              {children}
              {provided.placeholder}
              {checkAccess('add:tickets', projectId) && createBtn}
            </div>
          );
        }}
      </Droppable>
    </div>
  );

  if (index === undefined) {
    return renderColumn();
  }

  return (
    <Draggable
      draggableId={`column-${id}`}
      index={index}
      isDragDisabled={!checkAccess('edit:settings', projectId)}
    >
      {(dragProvided) => renderColumn(dragProvided)}
    </Draggable>
  );
}

DroppableColumn.defaultProps = {
  index: undefined
};
