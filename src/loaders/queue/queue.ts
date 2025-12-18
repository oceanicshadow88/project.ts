import { QueueManager } from './queueManager';

/**
 * Laravel: Illuminate\Support\Facades\Queue
 */
class QueueFacade {
  private readonly manager: QueueManager;

  constructor() {
    this.manager = new QueueManager();
  }

  /**
   * Dispatch a job to the queue (Laravel: Queue::dispatch())
   */
  public async dispatch(job: any): Promise<void> {
    const queueName = job.queue || 'default';
    await this.manager.push(job, job.payload, queueName);
  }

  /**
   * Push a job to the queue after a delay
   */
  public async later(delay: number, job: any): Promise<void> {
    const queueName = job.queue || 'default';
    await this.manager.later(delay, job, job.payload, queueName);
  }

  /**
   * Get a queue connection
   */
  public connection(name?: string) {
    return this.manager.connection(name);
  }

  /**
   * Check if queue is configured
   */
  public isConfigured(): boolean {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION
    );
  }

  /**
   * Get queue manager instance
   */
  public getManager(): QueueManager {
    return this.manager;
  }
}

// Export singleton instance (Laravel-style facade)
export const Queue = new QueueFacade();

// Also export the class for testing
export { QueueFacade };