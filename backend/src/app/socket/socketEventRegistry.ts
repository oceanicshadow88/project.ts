import { Server, Socket } from 'socket.io';
import { RetroSprintHandler } from './handlers/retroSprintHandler';

export class SocketEventRegistry {
  /**
   * Register all socket event handlers
   * Similar to Laravel's EventServiceProvider
   */
  static register(io: Server, socket: Socket): void {
    // Register retro sprint handlers
    RetroSprintHandler.register(io, socket);
    
    // Add more handlers here as needed
    // BoardHandler.register(io, socket);
    // TicketHandler.register(io, socket);
  }
}
