import http from 'http';
import { Socket } from 'socket.io';
import config from '../../../app/config/app';
import { Application } from '../../application';
import { winstonLogger } from '../../logger';
import { startHttp } from '../http';
import { createSocketServer } from '../../socket/socket';
import { SocketEventRegistry } from '../../../app/socket/socketEventRegistry';

const appCtx = new Application();
appCtx.init();
appCtx.addInstance('logger', winstonLogger);

const server = http.createServer(startHttp(appCtx));

const socketServer = createSocketServer(server);
socketServer.on('connection', (socket: Socket) => {
  // Register all socket events from the app layer
  SocketEventRegistry.register(socketServer, socket);
});
appCtx.addInstance('socketServer', socketServer);

server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`⚡️[server]: Server is running at http://localhost:${config.port}`);
}).on('error', (e:any) => {
  // eslint-disable-next-line no-console
  console.log('Error', e);
});

export default appCtx;
