import { io, Socket } from 'socket.io-client';
import config from '../config/config';

const socket: Socket = io(config.socketUrl, {
  autoConnect: false,
  withCredentials: false
});

let currentSprintId = '';

// Rooms live in server memory; re-join on every (re)connect.
const joinCurrentRetroRoom = () => {
  if (currentSprintId) {
    socket.emit('join_retro_sprint_room', currentSprintId);
  }
};

const onRetroRoomJoin = (sprintId: string) => {
  currentSprintId = sprintId;
  socket.off('connect', joinCurrentRetroRoom);
  socket.on('connect', joinCurrentRetroRoom);
  if (socket.connected) {
    joinCurrentRetroRoom();
  } else {
    socket.connect();
  }
};

const onRetroRoomLeave = () => {
  currentSprintId = '';
  socket.off('connect', joinCurrentRetroRoom);
  socket.disconnect();
};

const onRetroItemChange = (fetchRetoItemHandler: (sprintId: string) => void) => {
  socket.on('retro_item_updated', (sprintId) => {
    fetchRetoItemHandler(sprintId);
  });
};

const onRetroItemChangeCleanup = () => {
  socket.off('retro_item_updated');
};

const onRetroItemBroadcast = (sprintId: string) => {
  socket.emit('retro_item_boardcast', sprintId);
};

export {
  socket,
  onRetroRoomJoin,
  onRetroRoomLeave,
  onRetroItemChange,
  onRetroItemBroadcast,
  onRetroItemChangeCleanup
};
