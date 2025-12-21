import { Server, Socket } from 'socket.io';

export class RetroSprintHandler {
  /**
   * Register retro sprint related socket events
   */
  static register(io: Server, socket: Socket): void {
    this.registerJoinRoomHandler(socket);
    this.registerBroadcastHandler(io, socket);
  }

  /**
   * Handle joining retro sprint rooms
   */
  private static registerJoinRoomHandler(socket: Socket): void {
    socket.on('join_retro_sprint_room', (sprintId: string) => {
      socket.join(`retro_sprint_room_${sprintId}`);
      
      // Optional: Emit confirmation back to client
      socket.emit('joined_retro_sprint_room', { sprintId, success: true });
    });
  }

  /**
   * Handle broadcasting retro item updates
   */
  private static registerBroadcastHandler(io: Server, socket: Socket): void {
    socket.on('retro_item_boardcast', (sprintId: string) => {
      // Broadcast to all clients in the room except sender
      socket.to(`retro_sprint_room_${sprintId}`).emit('retro_item_updated', sprintId);
      
      // Or broadcast to all clients in the room including sender:
      // io.to(`retro_sprint_room_${sprintId}`).emit('retro_item_updated', sprintId);
    });
  }
}
