import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

export const createSocketServer = () => {
  const server = http.createServer();

  const socketServer = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false,
    },
  });

  return socketServer;
};