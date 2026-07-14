/* eslint-disable no-console */
import express, { NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '../../app/config/app';
import { errorHandler } from '../error/errorHandler';
import { globalAsyncErrorHandler } from './routes';
import status from 'http-status';
import { Application as AppContext } from '../application';
import compression from 'compression';
import apiRouterV2 from '../../app/routes/v2/api';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export function startHttp(appCtx: AppContext): express.Express {
  try {
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
      if (process.env.NODE_ENV === 'local') {
        console.error('Unhandled error:', err);
      }
      errorHandler.handleError(err);
      res.status(status.INTERNAL_SERVER_ERROR).send();
      next();
    });

    appCtx.addInstance('httpServer', server);
    return appCtx.getInstance<express.Express>('httpServer');
  } catch (e:any) {
    console.error('Error starting HTTP server:', e);
    throw e;
  }
}