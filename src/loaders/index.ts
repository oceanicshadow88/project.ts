const expressLoader = require('./express');
const socketLoader = require('./socket');
const serverLoader = require('./server');
const mongooseLoader = require('./mongoose');
const { QueueServiceProvider } = require('./queue/queueServiceProvider');

exports.init = () => {
  const app = expressLoader();
  const { httpServer, io } = socketLoader(app);
  serverLoader(httpServer, io);
  mongooseLoader();
  
  // Initialize Queue Service Provider (Laravel-style)
  const queueProvider = new QueueServiceProvider();
  queueProvider.register();
  queueProvider.boot();
};
