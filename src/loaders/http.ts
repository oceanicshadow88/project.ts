import express, { Application, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../app/config/app';

const apiRouterV2 = require('../app/routes/v2/api');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler } = require('./errorHandler');
import status from 'http-status';
import { globalAsyncErrorHandler } from './http/routes';
const compression = require('compression');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export function startHttp(appCtx: any): express.Express {

  const server = express();

  server.use(compression());
  server.use(cors({
    exposedHeaders: ['Content-Disposition'], 
  }));
  server.use(express.json());
  if (process.env.LIMITER?.toString() === true.toString()) {
    server.use(limiter);
  }
  server.use(helmet());
  server.use(`${config.api.prefix}/v2`, globalAsyncErrorHandler(apiRouterV2));
  server.use((err: Error, req: express.Request, res: express.Response, next: NextFunction) => {
    errorHandler.handleError(err, res);
    res.status(status.INTERNAL_SERVER_ERROR).send();
    next();
  });

  appCtx.addInstance('httpServer', server);
  return appCtx.getInstance<express.Express>('httpServer');
}