import { Socket } from 'socket.io';
import { createSocketServer } from '../socket';
import { SocketEventRegistry } from '../../../app/socket/socketEventRegistry';

const socketServer = createSocketServer();

socketServer.on('connection', (socket: Socket) => {
  // Register all socket events from the app layer
  SocketEventRegistry.register(socketServer, socket);
    
  socket.on('disconnect', () => {
    // Handle disconnect if needed
  });
});