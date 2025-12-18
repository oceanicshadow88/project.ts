import { QueueManager } from './queueManager';
import { winstonLogger } from '../logger';

/**
 * Laravel: Illuminate\Queue\Worker
 */
export class Worker {
  private isProcessing = false;

  private queueManager?: QueueManager;

  /**
   * Start processing jobs (Laravel: Worker::daemon)
   */
  public async daemon(connectionName: string, queue = 'default'): Promise<void> {
    this.isProcessing = true;
    winstonLogger.info('Starting queue worker daemon', { connectionName, queue });

    // Initialize queue manager
    this.queueManager = new QueueManager();

    while (this.isProcessing) {
      try {
        await this.runNextJob(connectionName, queue);
        await this.sleep(3000); // Wait 3 seconds between polls
      } catch (error) {
        winstonLogger.error('Error in worker daemon', {
          connectionName,
          queue,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        await this.sleep(10000); // Wait longer on error
      }
    }
  }

  /**
   * Stop the worker
   */
  public stop(): void {
    winstonLogger.info('Stopping queue worker');
    this.isProcessing = false;
  }

  /**
   * Process the next job in the queue
   */
  private async runNextJob(connectionName: string, queue: string): Promise<void> {
    if (!this.queueManager) {
      return;
    }

    const connection = this.queueManager.connection(connectionName);
    const jobData = await connection.pop(queue);

    if (!jobData) {
      return; // No jobs available
    }

    try {
      // Parse job payload
      const payload = JSON.parse(jobData.body);

      winstonLogger.info('Processing job', {
        jobClass: payload.job,
        messageId: jobData.messageId,
        attempts: jobData.attempts,
      });

      // Create and execute job instance
      const job = this.createJobInstance(payload);
      if (!job) {
        throw new Error(`Unknown job class: ${payload.job}`);
      }

      await job.handle();

      // Delete the job from queue after successful processing
      if (connection.deleteMessage) {
        await connection.deleteMessage(jobData.receiptHandle, queue);
      }

      winstonLogger.info('Job processed successfully', {
        jobClass: payload.job,
        messageId: jobData.messageId,
      });

    } catch (error) {
      winstonLogger.error('Job processing failed', {
        messageId: jobData.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      await this.handleJobFailure(jobData, error);
    }
  }

  /**
   * Create job instance from payload
   */
  private createJobInstance(payload: any): any {
    // Import job classes dynamically to avoid circular dependencies
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ProcessQuestionValidation } = require('../../app/jobs/ProcessQuestionValidation');
      
      if (payload.job === 'ProcessQuestionValidation') {
        return new ProcessQuestionValidation(payload.data);
      }
    } catch (error) {
      winstonLogger.error('Failed to import job class', { error });
    }

    return null;
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(jobData: any, error: any): Promise<void> {
    try {
      const payload = JSON.parse(jobData.body);
      const job = this.createJobInstance(payload);

      if (job && typeof job.failed === 'function') {
        await job.failed(error);
      }

      // For now, delete failed messages. In production, send to DLQ
      if (this.queueManager) {
        const connection = this.queueManager.connection();
        if (connection.deleteMessage) {
          await connection.deleteMessage(jobData.receiptHandle);
        }
      }
    } catch (failureError) {
      winstonLogger.error('Failed to handle job failure', {
        messageId: jobData.messageId,
        error: failureError instanceof Error ? failureError.message : 'Unknown error',
      });
    }
  }

  /**
   * Sleep for the given amount of time
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}