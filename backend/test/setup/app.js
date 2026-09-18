let application;

async function loadApp() {
  const { Application } = await import('../../src/bootstrap/application');
  const { winstonLogger } = await import('../../src/bootstrap/logger');
  const { startHttp } = await import('../../src/bootstrap/http/http');

  const appCtx = new Application();
  appCtx.init();
  appCtx.addInstance('logger', winstonLogger);

  application = startHttp(appCtx);
}
export default {
  loadApp,
  get application() {
    return application;
  },
};
