import { Queue } from './queue';
import { Worker } from './worker';
import { winstonLogger } from '../logger';

/**
 * Laravel-style Service Provider for Queue System
 * Like Laravel's QueueServiceProvider
 */
export class QueueServiceProvider {
  private worker?: Worker;

  /**
   * Register the service provider (Laravel: register() method)
   */
  public register(): void {
    // Queue system is registered via singleton pattern in Queue facade
    winstonLogger.info('Queue service provider registered');
  }

  /**
   * Bootstrap the application services (Laravel: boot() method)
   */
  public boot(): void {
    try {
      if (!Queue.isConfigured()) {
        winstonLogger.warn('Queue not configured, skipping queue system boot');
        return;
      }

      winstonLogger.info('Queue system booted successfully');

      // In production, workers should be managed by process managers (PM2, Supervisor)
      // Only auto-start in development if explicitly requested
      if (process.env.NODE_ENV === 'development' && process.env.AUTO_START_WORKERS === 'true') {
        this.startDevelopmentWorker();
      }

      // Register graceful shutdown handlers
      this.registerShutdownHandlers();

    } catch (error) {
      winstonLogger.error('Failed to boot queue system', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Start worker in development mode (non-blocking)
   */
  private startDevelopmentWorker(): void {
    winstonLogger.info('Auto-starting queue worker for development');
    
    // Create worker instance
    this.worker = new Worker();
    
    // Use setImmediate to prevent blocking the main application startup
    setImmediate(async () => {
      try {
        await this.worker!.daemon('sqs', 'default');
      } catch (error) {
        winstonLogger.error('Development queue worker error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  /**
   * Register graceful shutdown handlers (Laravel: app shutdown)
   */
  private registerShutdownHandlers(): void {
    const shutdown = async (signal: string) => {
      winstonLogger.info(`Received ${signal}, shutting down queue system gracefully`);
      try {
        if (this.worker) {
          this.worker.stop();
        }
        winstonLogger.info('Queue system stopped successfully');
        process.exit(0);
      } catch (error) {
        winstonLogger.error('Error during queue system shutdown', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        process.exit(1);
      }
    };

    // Handle various termination signals
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));

    // Handle uncaught exceptions (Laravel: exception handling)
    process.on('uncaughtException', (error) => {
      winstonLogger.error('Uncaught exception in queue system', {
        error: error.message,
        stack: error.stack,
      });
      shutdown('uncaughtException');
    });
  }
}

// Export singleton instance (Laravel: app()->make(QueueServiceProvider::class))
export const queueServiceProvider = new QueueServiceProvider();