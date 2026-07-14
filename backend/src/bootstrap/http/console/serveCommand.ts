
import config from '../../../app/config/app';
import { Application } from '../../application';
import { winstonLogger } from '../../logger';
import { startHttp } from '../http';

const appCtx = new Application();
appCtx.init();
appCtx.addInstance('logger', winstonLogger);

const server = startHttp(appCtx);
server.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`⚡️[server]: Server is running at http://localhost:${config.port}`);
}).on('error', (e:any) => {
  // eslint-disable-next-line no-console
  console.log('Error', e);
});

export default appCtx;