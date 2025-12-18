/**
 * Laravel: Illuminate\Contracts\Queue\Queue
 */
export interface QueueContract {
  /**
   * Get the connection name for the queue.
   */
  getConnectionName(): string;

  /**
   * Set the connection name for the queue.
   */
  setConnectionName(name: string): this;

  /**
   * Push a new job onto the queue.
   */
  push(job: any, data?: any, queue?: string): Promise<any>;

  /**
   * Push a new job onto the queue after a delay.
   */
  later(delay: number, job: any, data?: any, queue?: string): Promise<any>;

  /**
   * Pop the next job off of the queue.
   */
  pop(queue?: string): Promise<any>;

  /**
   * Get the size of the queue.
   */
  size(queue?: string): Promise<number>;
}